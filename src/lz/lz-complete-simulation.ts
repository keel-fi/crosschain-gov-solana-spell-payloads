/**
 * Complete cross-chain simulation for LayerZero governance messages
 * 
 * This module provides full LiteSVM-based simulation that executes
 * the actual lz_receive instruction through the governance program.
 * 
 * Based on the Rust reference implementation at:
 * /Users/mattauer/src/xchain-gov-simulation/src/simulation.rs
 */

import { web3 } from "@coral-xyz/anchor";
import { LiteSVM, FailedTransactionMetadata } from "litesvm";
import { Connection } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import {
  generateCrossChainPayload,
  CrossChainConfig,
  CrossChainPayload,
} from "../xchain-gov-payload";
import {
  deriveLayerZeroAccounts,
  deriveRemoteAccount,
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
} from "./lz-receive-types-v2";
import { deserializeLzInstruction } from "./lz-governance-codec";

// Default directory for mainnet programs
const MAINNET_PROGRAMS_DIR = "./mainnet_programs";

/**
 * Complete cross-chain simulation result for LiteSVM-based simulation
 */
export interface LzCompleteSimulationResult {
  /** The serialized payload for Ethereum side */
  serializedPayload: Buffer;
  /** Transaction signature from execution (simulated) */
  transactionSignature: string;
  /** Execution logs from LiteSVM */
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
  /** Directory containing program .so files */
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
 * Fix rentEpoch for LiteSVM compatibility
 */
function fixRentEpoch(account: web3.AccountInfo<Buffer>): web3.AccountInfo<Buffer> {
  return {
    ...account,
    rentEpoch: account.rentEpoch === 18_446_744_073_709_552_000
      ? 999_999_999_999_999
      : account.rentEpoch,
  };
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
 * Create minimal account for accounts that don't exist
 */
function createMinimalAccount(
  svm: LiteSVM,
  pubkey: web3.PublicKey,
  lamports: number = 1_000_000
): void {
  svm.setAccount(pubkey, {
    lamports,
    data: Buffer.alloc(0),
    owner: web3.SystemProgram.programId,
    executable: false,
    rentEpoch: 0,
  });
}

/**
 * Load an account into LiteSVM from RPC
 * Creates a minimal account if it doesn't exist on-chain
 */
async function loadAccount(
  svm: LiteSVM,
  connection: Connection,
  pubkey: web3.PublicKey,
  logPrefix: string = "account"
): Promise<void> {
  // Skip if already loaded
  if (svm.getAccount(pubkey)) {
    return;
  }
  
  const accountData = await safeGetAccountInfo(connection, pubkey);
  if (accountData) {
    const fixedAccount = fixRentEpoch(accountData);
    
    // Skip executable accounts - they should be loaded via addProgram
    if (fixedAccount.executable) {
      return;
    }
    
    try {
      svm.setAccount(pubkey, fixedAccount);
      return;
    } catch {
      // If setAccount fails, fall through to create minimal account
    }
  }
  
  // Create minimal account if account doesn't exist or setAccount failed
  try {
    createMinimalAccount(svm, pubkey);
  } catch {
    // Silently fail if we can't create the account
  }
}

/**
 * Load a program from RPC by fetching its program data account
 * For upgradeable programs, the bytecode is in the program data account
 */
async function loadProgramFromRpc(
  svm: LiteSVM,
  connection: Connection,
  programId: web3.PublicKey
): Promise<boolean> {
  try {
    // First, get the program account to find the program data address
    const programAccount = await connection.getAccountInfo(programId);
    if (!programAccount || !programAccount.executable) {
      return false;
    }
    
    // Check if this is an upgradeable program (owned by BPF Loader Upgradeable)
    const BPF_LOADER_UPGRADEABLE = new web3.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
    if (programAccount.owner.equals(BPF_LOADER_UPGRADEABLE)) {
      // For upgradeable programs, extract the program data address from the first 32 bytes
      // Format: [4 bytes type][32 bytes program data address]
      if (programAccount.data.length >= 36) {
        const programDataAddress = new web3.PublicKey(programAccount.data.slice(4, 36));
        const programDataAccount = await connection.getAccountInfo(programDataAddress);
        
        if (programDataAccount) {
          // Program data format: [45 bytes header][actual program bytecode]
          // The header contains: slot, upgrade authority, etc.
          const PROGRAM_DATA_HEADER_SIZE = 45;
          if (programDataAccount.data.length > PROGRAM_DATA_HEADER_SIZE) {
            const programBytecode = programDataAccount.data.slice(PROGRAM_DATA_HEADER_SIZE);
            svm.addProgram(programId, programBytecode);
            return true;
          }
        }
      }
    } else {
      // For non-upgradeable programs, the data is the bytecode directly
      svm.addProgram(programId, programAccount.data);
      return true;
    }
  } catch {
    // Silently fail if program can't be loaded
  }
  return false;
}

/**
 * Initialize LiteSVM with all core programs and current Solana clock
 */
async function initializeLiteSvmWithPrograms(
  connection: Connection,
  programsDir: string = MAINNET_PROGRAMS_DIR
): Promise<LiteSVM> {
  const svm = new LiteSVM();
  
  // Initialize clock with current Solana clock to avoid simulation failures
  // LiteSVM defaults to slot=0, unixTimestamp=0 which can cause issues
  const slot = await connection.getSlot();
  const blockTime = await connection.getBlockTime(slot);
  const svmClock = svm.getClock();
  svmClock.slot = BigInt(slot);
  svmClock.unixTimestamp = BigInt(blockTime ?? Math.floor(Date.now() / 1000));
  svm.setClock(svmClock);
  
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  
  // Load governance program
  const governancePath = path.join(programsDir, "governance_mainnet.so");
  if (fs.existsSync(governancePath)) {
    const governanceBinary = fs.readFileSync(governancePath);
    svm.addProgram(governanceProgram, governanceBinary);
  }
  
  // Load LayerZero endpoint
  const endpointPath = path.join(programsDir, "layerzero_endpoint.so");
  if (fs.existsSync(endpointPath)) {
    const endpointBinary = fs.readFileSync(endpointPath);
    svm.addProgram(LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM, endpointBinary);
  }
  
  // Load memo program
  const memoPath = path.join(programsDir, "memo_program.so");
  if (fs.existsSync(memoPath)) {
    const memoBinary = fs.readFileSync(memoPath);
    svm.addProgram(LayerZeroConfig.MEMO_PROGRAM, memoBinary);
  }
  
  return svm;
}

/**
 * Load essential governance accounts from mainnet
 */
async function loadEssentialGovernanceAccounts(
  svm: LiteSVM,
  config: CompleteSimulationConfig,
  connection: Connection
): Promise<void> {
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  
  // Load governance account
  await loadAccount(svm, connection, config.receiver, "governance account");
  
  // Load remote account
  const remoteAccount = deriveRemoteAccount(
    config.receiver,
    config.srcEid,
    governanceProgram
  );
  await loadAccount(svm, connection, remoteAccount, "remote account");
}

/**
 * Dynamically load all accounts referenced in the instruction
 */
async function loadInstructionAccounts(
  svm: LiteSVM,
  instruction: web3.TransactionInstruction,
  connection: Connection
): Promise<void> {
  // First load all non-program accounts referenced in the instruction
  // This ensures any accounts required by programs are loaded first
  for (const accountMeta of instruction.keys) {
    await loadAccount(svm, connection, accountMeta.pubkey, "instruction account");
  }
  
  // Load target program if not already loaded
  // Try to load from RPC using addProgram (for upgradeable programs)
  if (!svm.getAccount(instruction.programId)) {
    await loadProgramFromRpc(svm, connection, instruction.programId);
  }
}

/**
 * Create all required spoofed LayerZero accounts
 */
async function createCompleteSpoofedAccounts(
  svm: LiteSVM,
  payload: CrossChainPayload,
  config: CompleteSimulationConfig,
  connection: Connection
): Promise<void> {
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  
  const [oappRegistry, nonceAccount, payloadHashAccount] = deriveLayerZeroAccounts(
    config.receiver,
    config.srcEid,
    config.sender,
    config.nonce
  );
  
  // Create PayloadHash account
  const payloadHashData = createPayloadHashAccountData(payload.payloadHash);
  svm.setAccount(payloadHashAccount, {
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
    svm.setAccount(nonceAccount, fixRentEpoch(adjustedNonce));
  } else {
    const newNonce = createNonceAccountData(config.nonce);
    svm.setAccount(nonceAccount, newNonce);
  }
  
  // Load governance account
  await loadAccount(svm, connection, config.receiver, "governance account");
  
  // Load remote account
  const remoteAccount = deriveRemoteAccount(config.receiver, config.srcEid, governanceProgram);
  await loadAccount(svm, connection, remoteAccount, "remote account");
  
  // Load OApp registry
  await loadAccount(svm, connection, oappRegistry, "OApp registry");
  
  // Create CPI authority account
  const cpiAuthority = deriveCpiAuthority(
    config.receiver,
    config.srcEid,
    config.originCaller,
    governanceProgram
  );
  svm.setAccount(cpiAuthority, {
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
  svm.setAccount(endpointSettings, {
    lamports: 1500000,
    data: endpointData,
    owner: LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM,
    executable: false,
    rentEpoch: 0,
  });
}

/**
 * Execute the lz_receive instruction
 */
async function executeLzReceive(
  svm: LiteSVM,
  payer: web3.Keypair,
  config: CompleteSimulationConfig,
  lzParams: LzReceiveParams,
  executionPlan: LzReceiveTypesV2Result,
  connection: Connection
): Promise<{ logs: string[]; success: boolean; signature: string }> {
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
  const resolvedAccounts: web3.AccountMeta[] = [];
  for (let i = 0; i < lzReceiveAccounts.length; i++) {
    const accountRef = lzReceiveAccounts[i];
    const accountMeta = resolveAccountMeta(accountRef, payer.publicKey);

    // Ensure account exists in SVM (load from mainnet if needed)
    await loadAccount(svm, connection, accountMeta.pubkey, `lz_receive account [${i}]`);
    
    resolvedAccounts.push(accountMeta);
  }
  
  // Create the lz_receive instruction
  const lzReceiveIx = createLzReceiveInstruction(
    governanceProgram,
    resolvedAccounts,
    lzParams
  );
  
  // Build and send transaction
  const blockhash = svm.latestBlockhash();
  const messageV0 = new web3.TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [lzReceiveIx],
  }).compileToV0Message();
  
  const transaction = new web3.VersionedTransaction(messageV0);
  transaction.sign([payer]);
  
  const result = svm.sendTransaction(transaction);
  
  // Check if it's a failure
  if ('meta' in result && 'err' in result) {
    // Failed transaction
    const logs = result.meta().logs();
    const err = result.err();
    console.log("❌ lz_receive execution failed!");
    console.log(`📜 ERROR LOGS (${logs.length} entries):`);
    for (let i = 0; i < logs.length; i++) {
      console.log(`   [${i + 1}] ${logs[i]}`);
    }
    console.log(`🔥 Error: ${err}`);
    return { logs, success: false, signature: "failed" };
  }
  
  // Success
  const logs = result.logs();
  
  const signature = result.signature().toString();
  return { logs, success: true, signature };
}

/**
 * Get account states before and after simulation
 */
function getAccountStates(
  svm: LiteSVM,
  accountKeys: web3.PublicKey[],
  preState: Map<string, web3.AccountInfo<Buffer> | null>
): SimulateResponse {
  const result: SimulateResponse = {};
  
  for (const key of accountKeys) {
    const keyStr = key.toString();
    const before = preState.get(keyStr) || null;
    const afterAccount = svm.getAccount(key);
    
    let after: web3.AccountInfo<Buffer> | null = null;
    if (afterAccount) {
      after = {
        lamports: afterAccount.lamports,
        data: Buffer.from(afterAccount.data),
        owner: afterAccount.owner,
        executable: afterAccount.executable,
        rentEpoch: afterAccount.rentEpoch,
      };
    }
    
    result[keyStr] = { before, after };
  }
  
  return result;
}

/**
 * Execute complete cross-chain simulation with LiteSVM
 * 
 * This function:
 * 1. Generates cross-chain payload from instruction
 * 2. Initializes LiteSVM with required programs
 * 3. Loads all accounts from RPC
 * 4. Creates spoofed LayerZero accounts
 * 5. Calls lz_receive_types_v2 to get account resolution
 * 6. Executes the lz_receive instruction
 * 7. Returns account states and logs
 */
export async function simulateLzCompleteCrossChainInstruction(
  instruction: web3.TransactionInstruction,
  config: CompleteSimulationConfig
): Promise<LzCompleteSimulationResult> {
  const connection = new Connection(getRpcUrl(), "confirmed");
  
  // Step 1: Generate cross-chain payload
  console.log("📦 Step 1: Generating cross-chain payload");
  const payload = generateCrossChainPayload(instruction, config);
  
  // Step 2: Initialize LiteSVM
  console.log("🔧 Step 2: Initializing LiteSVM environment");
  const svm = await initializeLiteSvmWithPrograms(connection, config.programsDir);
  
  // Step 3: Create and fund payer
  const payer = web3.Keypair.generate();
  const payerBalance = 10_000_000_000; // 10 SOL
  svm.setAccount(payer.publicKey, {
    lamports: payerBalance,
    data: Buffer.alloc(0),
    owner: web3.SystemProgram.programId,
    executable: false,
    rentEpoch: 0,
  });
  
  // Step 4: Load essential governance accounts
  console.log("📋 Step 4: Loading essential governance accounts");
  await loadEssentialGovernanceAccounts(svm, config, connection);
  
  // Step 5: Dynamically load all accounts referenced in instruction
  console.log("🔍 Step 5: Dynamically loading instruction-specific accounts");
  await loadInstructionAccounts(svm, instruction, connection);
  
  // Step 6: Create spoofed LayerZero accounts
  console.log("🎭 Step 6: Creating spoofed LayerZero accounts");
  await createCompleteSpoofedAccounts(svm, payload, config, connection);
  
  // Step 7: Call lz_receive_types_v2 to get account resolution
  console.log("📋 Step 7: Calling lz_receive_types_v2 for account resolution");
  const senderBuffer = Buffer.from(config.sender);
  const lzParams = createLzReceiveParams(
    config.srcEid,
    senderBuffer,
    config.nonce,
    payload.guid,
    payload.message
  );
  
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  const executionPlan = await simulateLzReceiveTypesV2(
    svm,
    governanceProgram,
    config.receiver,
    lzParams,
    payer
  );
  
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
  
  const preState = new Map<string, web3.AccountInfo<Buffer> | null>();
  for (const key of uniqueKeys) {
    const account = svm.getAccount(key);
    if (account) {
      preState.set(key.toString(), {
        lamports: account.lamports,
        data: Buffer.from(account.data),
        owner: account.owner,
        executable: account.executable,
        rentEpoch: account.rentEpoch,
      });
    } else {
      preState.set(key.toString(), null);
    }
  }
  
  // Step 8: Build and execute real lz_receive instruction
  console.log("🚀 Step 8: Building and executing real lz_receive instruction");
  try {
    const { logs, success, signature } = await executeLzReceive(
      svm,
      payer,
      config,
      lzParams,
      executionPlan,
      connection
    );
    
    if (!success) {
      console.log("❌ lz_receive execution failed!");
      console.log(`📜 ERROR LOGS (${logs.length} entries):`);
      for (let i = 0; i < logs.length; i++) {
        console.log(`   [${i + 1}] ${logs[i]}`);
      }
    }
    
    const accountStates = getAccountStates(svm, uniqueKeys, preState);
    
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
    const accountStates = getAccountStates(svm, uniqueKeys, preState);
    
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
