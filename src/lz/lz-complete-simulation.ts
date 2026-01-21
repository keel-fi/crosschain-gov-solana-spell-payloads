/**
 * Complete cross-chain simulation for LayerZero governance messages
 * 
 * This module provides full Surfpool-based simulation that executes
 * the actual lz_receive instruction through the governance program.
 * 
 * Surfpool automatically fetches mainnet accounts "just in time" and
 * provides cheatcodes for state manipulation.
 * 
 * Based on the Rust reference implementation at:
 * /Users/mattauer/src/xchain-gov-simulation/src/simulation.rs
 */

import { web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import {
  generateCrossChainPayload,
  CrossChainConfig,
  CrossChainPayload,
} from "../xchain-gov-payload";
import {
  deriveLayerZeroAccounts,
  deriveCpiAuthority,
} from "../xchain-gov-spoof";
import {
  SKY_LZ_GOVERNANCE_PROGRAM_ID,
  SKY_LZ_GOVERNANCE_ACCOUNT,
  LayerZeroConfig,
  EthereumAddresses,
} from "../constants";
import { getRpcUrl, ethereumAddressToBytes32 } from "../utils";
import { SimulateResponse } from "../simulation-utils";
import {
  LzReceiveParams,
  LzReceiveTypesV2Result,
  simulateLzReceiveTypesV2,
  resolveAccountMeta,
  createLzReceiveInstruction,
  createLzReceiveParams,
  ParsedAccountMetaWithLocator,
} from "./lz-receive-types-v2";
import { deserializeLzInstruction } from "./lz-governance-codec";
import { surfnetSetAccount } from "../surfpool-utils";

/**
 * Build a fallback execution plan when lz_receive_types_v2 fails due to return data limit.
 * Constructs the plan from the original instruction accounts.
 */
function buildFallbackExecutionPlan(
  instruction: web3.TransactionInstruction,
  payer: web3.PublicKey,
  governanceAccount: web3.PublicKey
): LzReceiveTypesV2Result {
  const accounts: ParsedAccountMetaWithLocator[] = [];
  
  // Add payer as first account
  accounts.push({
    addressLocator: { type: "Payer" },
    pubkey: payer,
    isSigner: true,
    isWritable: true,
  });
  
  // Add governance account
  accounts.push({
    addressLocator: { type: "Address", address: governanceAccount },
    pubkey: governanceAccount,
    isSigner: false,
    isWritable: false,
  });
  
  // Add all accounts from the original instruction
  for (const key of instruction.keys) {
    if (key.pubkey.equals(payer) || key.pubkey.equals(governanceAccount)) continue;
    accounts.push({
      addressLocator: { type: "Address", address: key.pubkey },
      pubkey: key.pubkey,
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    });
  }
  
  console.log(`📋 Built fallback execution plan with ${accounts.length} accounts`);
  
  return {
    contextVersion: 1,
    alts: [],
    instructions: [{ type: "LzReceive", accounts }],
  };
}

/**
 * Complete cross-chain simulation result for Surfpool-based simulation
 */
export interface LzCompleteSimulationResult {
  /** The serialized payload for Ethereum side */
  serializedPayload: Buffer;
  /** Transaction signature from execution (simulated) */
  transactionSignature: string;
  /** Execution logs from Surfpool */
  executionLogs: string[];
  /** Whether execution was successful */
  success: boolean;
  /** The complete cross-chain payload */
  payload: CrossChainPayload;
  /** Before and after account states */
  accountStates: SimulateResponse;
  /** The payer public key used in the simulation */
  payer: web3.PublicKey;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Configuration for complete simulation
 */
export interface CompleteSimulationConfig extends CrossChainConfig {
  /** Payer public key for the simulation */
  payer: web3.PublicKey;
  /** CPI Authority public key */
  cpiAuthority: web3.PublicKey;
  /** Directory containing program .so files (unused with Surfpool - programs auto-load) */
  programsDir?: string;
}

/**
 * Create payload hash account data with Anchor discriminator
 * 
 * The payload hash is a LayerZero security mechanism used to prevent replay attacks.
 * It's calculated as Keccak256(GUID + message) and stored in a PayloadHash PDA account
 * owned by the LayerZero endpoint program. When a cross-chain message is received,
 * LayerZero checks if this payload hash already exists - if it does, the message is
 * rejected as a duplicate. This ensures each message can only be processed once,
 * even if the same nonce is reused or the message is retransmitted.
 */
function createPayloadHashAccountData(payloadHash: Buffer): Buffer {
  const discriminator = Buffer.from([96, 28, 106, 145, 103, 32, 186, 70]); // Anchor discriminator
  const data = Buffer.alloc(discriminator.length + payloadHash.length + 1);
  discriminator.copy(data, 0);
  payloadHash.copy(data, discriminator.length);
  data[discriminator.length + payloadHash.length] = 255; // bump seed
  return data;
}

/**
 * Adjust nonce account data to allow target nonce
 * 
 * This function modifies an existing LayerZero nonce account owned by the
 * LayerZero Endpoint Program to set the allowed inbound nonce value. The nonce
 * account tracks both outbound and inbound nonces for cross-chain message
 * ordering and replay protection.
 * 
 * Account structure (17 bytes):
 * - [0]: bump seed (1 byte)
 * - [1-8]: outbound nonce (8 bytes, little-endian u64)
 * - [9-16]: inbound nonce (8 bytes, little-endian u64)
 * 
 * The allowed nonce is set to (targetNonce - 1) to ensure the target nonce
 * can be accepted when the message is processed.
 */
function adjustNonceAccountData(
  account: web3.AccountInfo<Buffer>,
  targetNonce: bigint
): web3.AccountInfo<Buffer> {
  const data = Buffer.from(account.data);
  if (data.length >= 17) {
    const allowedNonce = targetNonce > 0n ? targetNonce - 1n : 0n;
    const nonceBytes = Buffer.allocUnsafe(8);
    nonceBytes.writeBigUInt64LE(allowedNonce, 0);
    nonceBytes.copy(data, 9);
  }
  return {
    ...account,
    data,
  };
}

/**
 * Create nonce account data for LayerZero Endpoint Program
 * 
 * Creates a new nonce account owned by the LayerZero Endpoint Program that
 * tracks nonces for cross-chain message ordering and replay protection. This
 * account is a PDA (Program Derived Address) derived from the OApp, source
 * endpoint ID, and sender address.
 * 
 * Account structure (17 bytes):
 * - [0]: bump seed (1 byte, set to 255 for simulation)
 * - [1-8]: outbound nonce (8 bytes, little-endian u64, initialized to 0)
 * - [9-16]: inbound nonce (8 bytes, little-endian u64, set to targetNonce - 1)
 * 
 * The inbound nonce is set to (targetNonce - 1) to ensure the target nonce
 * can be accepted when the cross-chain message is processed by the LayerZero
 * Endpoint Program's lz_receive instruction.
 */
function createNonceAccountData(targetNonce: bigint): web3.AccountInfo<Buffer> {
  const data = Buffer.alloc(17);
  data[0] = 255; // bump
  const nonceBytes = Buffer.allocUnsafe(8);
  nonceBytes.writeBigUInt64LE(0n, 0); // outbound nonce
  nonceBytes.copy(data, 1);
  const allowedNonce = targetNonce > 0n ? targetNonce - 1n : 0n;
  nonceBytes.writeBigUInt64LE(allowedNonce, 0); // inbound nonce
  nonceBytes.copy(data, 9);
  
  return {
    lamports: 1000000,
    data,
    owner: LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM,
    executable: false,
    rentEpoch: 0,
  };
}

/**
 * Create endpoint settings account data
 */
function createEndpointSettingsData(bump: number, admin: web3.PublicKey): Buffer {
  const discriminator = Buffer.from([221, 232, 73, 56, 10, 66, 72, 14]); // Anchor discriminator
  const eidBytes = Buffer.allocUnsafe(4);
  eidBytes.writeUInt32LE(LayerZeroConfig.SOLANA_ENDPOINT_ID, 0);
  const data = Buffer.alloc(discriminator.length + 4 + 1 + 32 + 1 + 32);
  let offset = 0;
  discriminator.copy(data, offset);
  offset += discriminator.length;
  eidBytes.copy(data, offset);
  offset += 4;
  data[offset] = bump;
  offset += 1;
  admin.toBuffer().copy(data, offset);
  offset += 32;
  data[offset] = 0; // lz_token_mint: None
  return data;
}

/**
 * Safely get account info with error handling
 */
async function safeGetAccountInfo(
  connection: Connection,
  pubkey: web3.PublicKey
): Promise<web3.AccountInfo<Buffer> | null> {
  try {
    return await connection.getAccountInfo(pubkey);
  } catch {
    return null;
  }
}

/**
 * Create all required spoofed LayerZero accounts using Surfpool cheatcodes
 */
async function createCompleteSpoofedAccounts(
  connection: Connection,
  payload: CrossChainPayload,
  config: CompleteSimulationConfig
): Promise<void> {
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  
  const [oappRegistry, nonceAccount, payloadHashAccount] = deriveLayerZeroAccounts(
    config.receiver,
    config.srcEid,
    config.sender,
    config.nonce
  );
  
  // Create PayloadHash account using surfnet_setAccount
  const payloadHashData = createPayloadHashAccountData(payload.payloadHash);
  await surfnetSetAccount(connection, payloadHashAccount, {
    lamports: 1000000,
    data: payloadHashData,
    owner: LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM,
    executable: false,
    rentEpoch: 0,
  });
  
  // Create or adjust nonce account
  const existingNonce = await safeGetAccountInfo(connection, nonceAccount);
  if (existingNonce) {
    const adjustedNonce = adjustNonceAccountData(existingNonce, config.nonce);
    await surfnetSetAccount(connection, nonceAccount, adjustedNonce);
  } else {
    const newNonce = createNonceAccountData(config.nonce);
    await surfnetSetAccount(connection, nonceAccount, newNonce);
  }
  
  // Create CPI authority account
  const cpiAuthority = deriveCpiAuthority(
    config.receiver,
    config.srcEid,
    config.originCaller,
    governanceProgram
  );
  await surfnetSetAccount(connection, cpiAuthority, {
    lamports: 0,
    data: Buffer.alloc(0),
    owner: web3.SystemProgram.programId,
    executable: false,
    rentEpoch: 0,
  });
  
  // Create EndpointSettings account
  const [endpointSettings, endpointBump] = web3.PublicKey.findProgramAddressSync(
    [LayerZeroConfig.ENDPOINT_SEED],
    LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM
  );
  const endpointData = createEndpointSettingsData(endpointBump, config.receiver);
  await surfnetSetAccount(connection, endpointSettings, {
    lamports: 1500000,
    data: endpointData,
    owner: LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM,
    executable: false,
    rentEpoch: 0,
  });
}

/**
 * Execute the lz_receive instruction using Surfpool RPC execution
 * 
 * This function creates an Address Lookup Table (ALT) to reduce transaction size,
 * as lz_receive transactions often exceed the 1232 byte limit due to many accounts.
 */
async function executeLzReceive(
  connection: Connection,
  payer: web3.Keypair,
  lzParams: LzReceiveParams,
  executionPlan: LzReceiveTypesV2Result,
  uniqueKeys: web3.PublicKey[]
): Promise<{ logs: string[]; success: boolean; signature: string; postSimulationAccounts: Map<string, web3.AccountInfo<Buffer> | null> }> {
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  
  // Find the LzReceive instruction in the execution plan
  const lzReceiveInstruction = executionPlan.instructions.find(
    (inst) => inst.type === "LzReceive"
  );
  
  if (!lzReceiveInstruction || lzReceiveInstruction.type !== "LzReceive") {
    throw new Error("No LzReceive instruction found in execution plan");
  }
  
  const lzReceiveAccounts = lzReceiveInstruction.accounts;
  
  // Resolve AddressLocator to actual AccountMeta
  // IMPORTANT: Keep accounts in the exact order returned by lz_receive_types_v2
  // The instruction expects accounts at specific indices - do NOT reorder or deduplicate here
  // The compileToV0Message function handles deduplication internally
  const resolvedAccounts: web3.AccountMeta[] = [];
  for (let i = 0; i < lzReceiveAccounts.length; i++) {
    const accountRef = lzReceiveAccounts[i];
    const accountMeta = resolveAccountMeta(accountRef, payer.publicKey);
    resolvedAccounts.push(accountMeta);
  }
  
  console.log(`📋 Resolved ${resolvedAccounts.length} accounts for lz_receive instruction`);
  
  // Create the lz_receive instruction - accounts must be in the exact order
  const lzReceiveIx = createLzReceiveInstruction(
    governanceProgram,
    resolvedAccounts,
    lzParams
  );
  
  // Build transaction with Address Lookup Table to reduce size
  // The transaction is too large without ALT (1374 > 1232 bytes)
  const blockhash = await connection.getLatestBlockhash();
  
  // Collect unique non-signer accounts for ALT (signers can't be in ALT)
  const altAccounts: web3.PublicKey[] = [];
  const seenKeys = new Set<string>();
  seenKeys.add(payer.publicKey.toBase58()); // Exclude payer (signer)
  
  for (const acc of resolvedAccounts) {
    const key = acc.pubkey.toBase58();
    if (!seenKeys.has(key) && !acc.isSigner) {
      altAccounts.push(acc.pubkey);
      seenKeys.add(key);
    }
  }
  
  console.log(`📋 Creating ALT with ${altAccounts.length} accounts to reduce transaction size`);
  
  // Create Address Lookup Table
  const slot = await connection.getSlot();
  const [createAltIx, altAddress] = web3.AddressLookupTableProgram.createLookupTable({
    authority: payer.publicKey,
    payer: payer.publicKey,
    recentSlot: slot - 1,
  });
  
  // Extend ALT with accounts (max 30 per instruction)
  const extendIxs: web3.TransactionInstruction[] = [];
  for (let i = 0; i < altAccounts.length; i += 30) {
    const chunk = altAccounts.slice(i, i + 30);
    extendIxs.push(
      web3.AddressLookupTableProgram.extendLookupTable({
        payer: payer.publicKey,
        authority: payer.publicKey,
        lookupTable: altAddress,
        addresses: chunk,
      })
    );
  }
  
  // Create and extend ALT in one transaction
  const setupTx = new web3.Transaction();
  setupTx.recentBlockhash = blockhash.blockhash;
  setupTx.feePayer = payer.publicKey;
  setupTx.add(createAltIx, ...extendIxs);
  setupTx.sign(payer);
  
  const setupSig = await connection.sendRawTransaction(setupTx.serialize(), {
    skipPreflight: true,
  });
  await connection.confirmTransaction(setupSig, "confirmed");
  console.log(`✅ ALT created and extended: ${altAddress.toBase58()}`);
  
  // Fetch the ALT account
  const altAccount = await connection.getAddressLookupTable(altAddress);
  if (!altAccount.value) {
    throw new Error("Failed to fetch ALT account after creation");
  }
  
  console.log(`📋 ALT contains ${altAccount.value.state.addresses.length} addresses`);
  
  // Build V0 message with ALT
  let messageV0: web3.MessageV0;
  let transaction: web3.VersionedTransaction;
  
  try {
    messageV0 = new web3.TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash.blockhash,
      instructions: [lzReceiveIx],
    }).compileToV0Message([altAccount.value]);
    
    transaction = new web3.VersionedTransaction(messageV0);
    transaction.sign([payer]);
    
    const serialized = transaction.serialize();
    console.log(`📦 Transaction size with ALT: ${serialized.length} bytes (limit: 1232)`);
  } catch (compileError: any) {
    console.log("❌ Failed to compile transaction:");
    console.log(`   Error: ${compileError?.message || String(compileError)}`);
    console.log(`   Instruction data length: ${lzReceiveIx.data.length} bytes`);
    console.log(`   Number of accounts: ${resolvedAccounts.length}`);
    console.log("   Accounts:");
    for (let i = 0; i < resolvedAccounts.length; i++) {
      const acc = resolvedAccounts[i];
      console.log(`   [${i}] ${acc.pubkey.toBase58()} (signer: ${acc.isSigner}, writable: ${acc.isWritable})`);
    }
    throw compileError;
  }
  
  try {
    // Send and execute the transaction
    console.log("🚀 Executing lz_receive transaction...");
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    
    // Wait for transaction confirmation
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    
    if (confirmation.value.err) {
      console.log("❌ lz_receive execution failed!");
      console.log(`🔥 Error: ${JSON.stringify(confirmation.value.err)}`);
      
      // Try to get transaction details for logs even on failure
      let logs: string[] = [];
      try {
        const txDetails = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (txDetails?.meta?.logMessages) {
          logs = txDetails.meta.logMessages;
          console.log(`📜 ERROR LOGS (${logs.length} entries):`);
          for (let i = 0; i < logs.length; i++) {
            console.log(`   [${i + 1}] ${logs[i]}`);
          }
        }
      } catch (e) {
        // If we can't get transaction details, continue with empty logs
      }
      
      // Fetch post-execution account states even on failure
      const postExecutionAccounts = await connection.getMultipleAccountsInfo(uniqueKeys);
      const postSimulationAccounts = new Map<string, web3.AccountInfo<Buffer> | null>();
      for (let i = 0; i < uniqueKeys.length; i++) {
        postSimulationAccounts.set(uniqueKeys[i].toBase58(), postExecutionAccounts[i] || null);
      }
      
      return { logs, success: false, signature, postSimulationAccounts };
    }
    
    // Get transaction details to extract logs
    const txDetails = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    
    if (!txDetails) {
      throw new Error("Failed to fetch transaction details after confirmation");
    }
    
    const logs = txDetails.meta?.logMessages || [];
    
    console.log("✅ lz_receive execution succeeded!");
    console.log(`📜 EXECUTION LOGS (${logs.length} entries):`);
    for (let i = 0; i < logs.length; i++) {
      console.log(`   [${i + 1}] ${logs[i]}`);
    }
    
    // Fetch post-execution account states
    const postExecutionAccounts = await connection.getMultipleAccountsInfo(uniqueKeys);
    const postSimulationAccounts = new Map<string, web3.AccountInfo<Buffer> | null>();
    for (let i = 0; i < uniqueKeys.length; i++) {
      postSimulationAccounts.set(uniqueKeys[i].toBase58(), postExecutionAccounts[i] || null);
    }
    
    return { logs, success: true, signature, postSimulationAccounts };
  } catch (error: any) {
    console.log("❌ Exception during lz_receive execution:");
    console.log(`   Error: ${error?.message || String(error)}`);
    
    // Try to fetch account states even on exception
    let postSimulationAccounts = new Map<string, web3.AccountInfo<Buffer> | null>();
    try {
      const postExecutionAccounts = await connection.getMultipleAccountsInfo(uniqueKeys);
      for (let i = 0; i < uniqueKeys.length; i++) {
        postSimulationAccounts.set(uniqueKeys[i].toBase58(), postExecutionAccounts[i] || null);
      }
    } catch (e) {
      // If we can't fetch accounts, return empty map
    }
    
    return { 
      logs: [], 
      success: false, 
      signature: error?.signature || "error", 
      postSimulationAccounts 
    };
  }
}

/**
 * Get account states before and after simulation
 */
async function getAccountStates(
  accountKeys: web3.PublicKey[],
  preState: Map<string, web3.AccountInfo<Buffer> | null>,
  postSimulationAccounts: Map<string, web3.AccountInfo<Buffer> | null>
): Promise<SimulateResponse> {
  const result: SimulateResponse = {};
  
  for (let i = 0; i < accountKeys.length; i++) {
    const key = accountKeys[i];
    const keyStr = key.toString();
    const before = preState.get(keyStr) || null;
    // Use post-simulation state if available, otherwise use pre-state (account unchanged)
    const after = postSimulationAccounts.has(keyStr) 
      ? postSimulationAccounts.get(keyStr) ?? null
      : before;
    
    result[keyStr] = { before, after };
  }
  
  return result;
}

/**
 * Execute complete cross-chain simulation with Surfpool
 * 
 * This function:
 * 1. Generates cross-chain payload from instruction
 * 2. Creates spoofed LayerZero accounts via surfnet_setAccount
 * 3. Calls lz_receive_types_v2 to get account resolution
 * 4. Executes the lz_receive instruction via sendTransaction
 * 5. Returns account states and logs
 * 
 * Surfpool automatically fetches mainnet accounts on demand (JIT),
 * so we don't need to manually load programs or accounts.
 */
export async function simulateLzCompleteCrossChainInstruction(
  instruction: web3.TransactionInstruction,
  config: CompleteSimulationConfig
): Promise<LzCompleteSimulationResult> {
  const connection = new Connection(getRpcUrl(), "confirmed");
  
  // Step 1: Generate cross-chain payload
  console.log("📦 Step 1: Generating cross-chain payload");
  const payload = generateCrossChainPayload(instruction, config);
  
  // Step 2: Create and fund payer via surfnet_setAccount
  console.log("🔧 Step 2: Setting up payer account");
  const payer = web3.Keypair.generate();
  const payerBalance = 10_000_000_000; // 10 SOL
  await surfnetSetAccount(connection, payer.publicKey, {
    lamports: payerBalance,
    data: Buffer.alloc(0),
    owner: web3.SystemProgram.programId,
    executable: false,
    rentEpoch: 0,
  });
  
  // Step 3: Create spoofed LayerZero accounts
  console.log("🎭 Step 3: Creating spoofed LayerZero accounts");
  await createCompleteSpoofedAccounts(connection, payload, config);
  
  // Step 4: Call lz_receive_types_v2 to get account resolution
  console.log("📋 Step 4: Calling lz_receive_types_v2 for account resolution");
  const senderBuffer = Buffer.from(config.sender);
  const lzParams = createLzReceiveParams(
    config.srcEid,
    senderBuffer,
    config.nonce,
    payload.guid,
    payload.message
  );
  
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  let executionPlan: LzReceiveTypesV2Result;
  
  try {
    executionPlan = await simulateLzReceiveTypesV2(
      connection,
      governanceProgram,
      config.receiver,
      lzParams,
      payer
    );
  } catch (error: any) {
    // Fallback: construct execution plan from original instruction accounts
    // This is needed when lz_receive_types_v2 return data exceeds 1024 bytes
    if (error.message?.includes("Return data too large") || error.message?.includes("Empty return data")) {
      console.log("⚠️ lz_receive_types_v2 failed due to return data limit - using fallback account resolution");
      executionPlan = buildFallbackExecutionPlan(instruction, payer.publicKey, config.receiver);
    } else {
      throw error;
    }
  }
  
  // Capture pre-state of all relevant accounts
  const accountKeys = [
    payer.publicKey,
    ...instruction.keys.map(k => k.pubkey),
  ];
  
  // Add accounts from execution plan
  for (const inst of executionPlan.instructions) {
    if (inst.type === "LzReceive") {
      for (const acc of inst.accounts) {
        const resolved = resolveAccountMeta(acc, payer.publicKey);
        accountKeys.push(resolved.pubkey);
      }
    }
  }
  
  const uniqueKeys = [...new Set(accountKeys.map(k => k.toString()))].map(k => new web3.PublicKey(k));
  
  // Fetch pre-state from Surfpool
  const preStateAccounts = await connection.getMultipleAccountsInfo(uniqueKeys);
  const preState = new Map<string, web3.AccountInfo<Buffer> | null>();
  for (let i = 0; i < uniqueKeys.length; i++) {
    preState.set(uniqueKeys[i].toString(), preStateAccounts[i]);
  }
  
  // Step 4.5: Reset writable accounts that should be uninitialized
  // This is needed because Surfpool maintains state between runs
  // Only reset accounts owned by the target program (controller), not LayerZero infrastructure
  console.log("🧹 Step 4.5: Resetting writable accounts that should be uninitialized");
  
  // Get the target program ID from the original instruction
  // We only reset accounts owned by this program (not LayerZero infrastructure)
  const targetProgramId = instruction.programId.toBase58();
  
  for (const inst of executionPlan.instructions) {
    if (inst.type === "LzReceive") {
      for (const acc of inst.accounts) {
        const resolved = resolveAccountMeta(acc, payer.publicKey);
        
        // Only consider writable non-signer accounts
        if (!resolved.isWritable || resolved.isSigner) continue;
        
        const existingAccount = await safeGetAccountInfo(connection, resolved.pubkey);
        
        // Only reset if:
        // 1. Account exists and has data (already initialized)
        // 2. Account is owned by the target program (controller) - these are the accounts we want to "re-initialize"
        if (existingAccount && existingAccount.data.length > 0) {
          const ownerStr = existingAccount.owner.toBase58();
          
          // Only reset accounts owned by the target program (controller)
          // Don't reset LayerZero accounts or other infrastructure
          if (ownerStr === targetProgramId) {
            console.log(`   🔄 Resetting account ${resolved.pubkey.toBase58()} (owned by ${ownerStr}) to uninitialized state`);
            await surfnetSetAccount(connection, resolved.pubkey, {
              lamports: 0,
              data: Buffer.alloc(0),
              owner: web3.SystemProgram.programId,
              executable: false,
              rentEpoch: 0,
            });
          }
        }
      }
    }
  }
  
  // Step 5: Build and execute real lz_receive instruction
  console.log("🚀 Step 5: Building and executing real lz_receive instruction");
  try {
    const { logs, success, signature, postSimulationAccounts } = await executeLzReceive(
      connection,
      payer,
      lzParams,
      executionPlan,
      uniqueKeys
    );
    
    if (!success) {
      console.log("❌ lz_receive execution failed!");
      console.log(`📜 ERROR LOGS (${logs.length} entries):`);
      for (let i = 0; i < logs.length; i++) {
        console.log(`   [${i + 1}] ${logs[i]}`);
      }
    }
    
    const accountStates = await getAccountStates(uniqueKeys, preState, postSimulationAccounts);
    
    return {
      serializedPayload: payload.serializedInstruction,
      transactionSignature: signature,
      executionLogs: logs,
      success,
      payload,
      accountStates,
      payer: payer.publicKey,
      error: success ? undefined : `Simulation failed. Logs:\n${logs.join('\n')}`,
    };
  } catch (error: any) {
    console.log("❌ Exception during lz_receive execution:");
    console.log(`   Error: ${error?.message || String(error)}`);
    const accountStates = await getAccountStates(uniqueKeys, preState, new Map());
    
    return {
      serializedPayload: payload.serializedInstruction,
      transactionSignature: "error",
      executionLogs: [],
      success: false,
      payload,
      accountStates,
      payer: payer.publicKey,
      error: error?.message || String(error),
    };
  }
}

/**
 * Create complete simulation config from common parameters
 */
export function createCompleteSimulationConfig(
  payer: web3.PublicKey,
  cpiAuthority: web3.PublicKey,
  nonce: bigint = 1n
): CompleteSimulationConfig {
  return {
    srcEid: LayerZeroConfig.ETHEREUM_ENDPOINT_ID,
    dstEid: LayerZeroConfig.SOLANA_ENDPOINT_ID,
    sender: ethereumAddressToBytes32(EthereumAddresses.GOVERNANCE_OAPP_SENDER),
    receiver: new web3.PublicKey(SKY_LZ_GOVERNANCE_ACCOUNT),
    nonce,
    originCaller: ethereumAddressToBytes32(EthereumAddresses.KEEL_PROXY),
    payer,
    cpiAuthority,
  };
}

/**
 * Simulate a controller payload with complete cross-chain flow
 * 
 * This is a convenience function for validation scripts that takes a payload
 * and returns account states.
 * 
 * IMPORTANT: The payload should contain LZ_PAYER_PLACEHOLDER and other placeholders.
 * We deserialize WITHOUT replacing them so the governance program's lz_receive_types_v2
 * can recognize them and return the correct AddressLocator types (Payer, etc.).
 */
export async function simulatePayloadWithCompleteCrossChainFlow(
  payload: Buffer,
  targetProgram: web3.PublicKey,
  payer: web3.PublicKey,
  cpiAuthority: web3.PublicKey,
  nonce: bigint = 1n
): Promise<{ accountStates: SimulateResponse; payer: web3.PublicKey }> {
  // Deserialize instruction WITHOUT replacing placeholders
  // This allows the governance program to recognize placeholders and return
  // AddressLocator::Payer for LZ_PAYER_PLACEHOLDER, etc.
  const instruction = deserializeLzInstruction(
    targetProgram,
    payload,
  );
  
  // Create config - the payer here is used for account states comparison only
  const config = createCompleteSimulationConfig(payer, cpiAuthority, nonce);
  
  // Run complete simulation
  const result = await simulateLzCompleteCrossChainInstruction(instruction, config);
  
  if (!result.success) {
    throw new Error(`Complete simulation failed: ${result.error}. Check logs above for details.`);
  }
  
  return { accountStates: result.accountStates, payer: result.payer };
}
