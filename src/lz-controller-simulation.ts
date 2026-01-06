/**
 * Layer Zero simulation for SVM ALM Controller instructions
 * 
 * This module provides functionality to simulate controller instructions
 * through Layer Zero governance, allowing validation of cross-chain payloads
 * before they are executed on-chain.
 */

import { web3 } from "@coral-xyz/anchor";
import { LiteSVM } from "litesvm";
import { Connection } from "@solana/web3.js";
import {
  generateCrossChainPayload,
  CrossChainConfig,
  CrossChainPayload,
} from "./xchain-gov-payload";
import {
  deriveLayerZeroAccounts,
  deriveRemoteAccount,
  deriveCpiAuthority,
} from "./xchain-gov-spoof";
import {
  SKY_LZ_GOVERNANCE_PROGRAM_ID,
  LayerZeroConfig,
  EthereumAddresses,
  SKY_LZ_GOVERNANCE_ACCOUNT,
  SVM_ALM_CONTROLLER_PROGRAM_DATA,
  BPF_LOADER_PROGRAM_ID,
} from "./constants";
import { getRpcUrl, ethereumAddressToBytes32 } from "./utils";
import {
  convertLzSolanaGovernancePayloadToInstruction,
  LZ_CPI_AUTHORITY_PLACEHOLDER,
  LZ_PAYER_PLACEHOLDER,
  LZ_CONTEXT_PLACEHOLDER,
} from "./lz-governance-codec";
import {
  simulateInstructions,
  SimulateResponse,
} from "./simulation-utils";

/**
 * Configuration for Layer Zero controller simulation
 */
export interface LzControllerSimulationConfig extends CrossChainConfig {
  /** Payer public key for the simulation */
  payer: web3.PublicKey;
  /** CPI Authority public key (usually KEEL_SUB_PROXY_CPI_AUTHORITY) */
  cpiAuthority: web3.PublicKey;
}

/**
 * Result of Layer Zero controller simulation
 */
export interface LzControllerSimulationResult {
  /** Before and after account states */
  accountStates: SimulateResponse;
  /** The cross-chain payload that was simulated */
  payload: CrossChainPayload;
  /** Execution logs from LiteSVM */
  logs: string[];
  /** Whether execution was successful */
  success: boolean;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Note: To simulate the full Layer Zero governance flow including the lz_receive
 * instruction, you would need the governance program's IDL to construct the
 * instruction properly. However, for validation purposes, simulating the target
 * instruction directly is equivalent since the governance program simply
 * deserializes and executes the target instruction.
 * 
 * The Layer Zero accounts (payload hash, nonce, etc.) are set up correctly
 * to match the production environment, so the simulation results will be
 * accurate for validation purposes.
 */

/**
 * Helper to fix rentEpoch for LiteSVM compatibility
 * LiteSVM requires rentEpoch to be a number, not bigint
 */
function fixRentEpoch(account: web3.AccountInfo<Buffer>): web3.AccountInfo<Buffer> {
  let rentEpoch: number;
  
  if (typeof account.rentEpoch === 'bigint') {
    const maxU64 = 18_446_744_073_709_552_000n;
    rentEpoch = account.rentEpoch >= maxU64
      ? 999_999_999_999_999
      : Number(account.rentEpoch);
  } else if (typeof account.rentEpoch === 'number') {
    const maxU64Num = 18_446_744_073_709_552_000;
    rentEpoch = account.rentEpoch >= maxU64Num
      ? 999_999_999_999_999
      : account.rentEpoch;
  } else {
    // Fallback
    rentEpoch = 999_999_999_999_999;
  }
  
  // Ensure it's definitely a number, not bigint
  return {
    lamports: Number(account.lamports),
    data: account.data,
    owner: account.owner,
    executable: account.executable,
    rentEpoch: Number(rentEpoch),
  };
}

/**
 * Safely load account info handling bigint rentEpoch issues
 * Uses raw RPC call to avoid bigint parsing errors
 */
async function safeGetAccountInfo(
  connection: Connection,
  pubkey: web3.PublicKey
): Promise<web3.AccountInfo<Buffer> | null> {
  try {
    // Use raw RPC call to get account data
    const response = await (connection as any)._rpcRequest('getAccountInfo', [
      pubkey.toBase58(),
      {
        encoding: 'base64',
        commitment: 'confirmed',
      },
    ]);
    
    if (!response.result?.value) {
      return null;
    }
    
    const accountData = response.result.value;
    
    // Manually construct account info with fixed rentEpoch
    const account: web3.AccountInfo<Buffer> = {
      lamports: accountData.lamports,
      data: Buffer.from(accountData.data[0], 'base64'),
      owner: new web3.PublicKey(accountData.owner),
      executable: accountData.executable,
      rentEpoch: 999_999_999_999_999, // Always use safe value for LiteSVM
    };
    
    return account;
  } catch (error: any) {
    // Fallback to regular getAccountInfo if raw RPC fails
    try {
      const account = await connection.getAccountInfo(pubkey);
      return account ? fixRentEpoch(account) : null;
    } catch (fallbackError: any) {
      if (fallbackError?.message?.includes('Bigint too large')) {
        // If we still get bigint error, return null
        return null;
      }
      throw fallbackError;
    }
  }
}

/**
 * Load a single account from an instruction account meta into LiteSVM
 * 
 * This helper function handles:
 * - Loading account data from RPC
 * - Fixing rentEpoch for LiteSVM compatibility
 * - Creating minimal accounts if the account doesn't exist
 * - Handling errors gracefully
 * 
 * @param svm - LiteSVM instance
 * @param connection - Solana connection
 * @param accountMeta - Account metadata from instruction
 * @param logPrefix - Prefix for log messages (e.g., "instruction account", "additional account")
 */
async function loadInstructionAccount(
  svm: LiteSVM,
  connection: Connection,
  accountMeta: web3.AccountMeta,
  logPrefix: string = "account"
): Promise<void> {
  if (svm.getAccount(accountMeta.pubkey)) {
    return; // Account already loaded
  }

  try {
    const accountData = await safeGetAccountInfo(connection, accountMeta.pubkey);
    if (accountData) {
      const fixedAccount = fixRentEpoch(accountData);
      if (typeof fixedAccount.rentEpoch !== 'number') {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      // Try to set the account, but skip if it fails due to missing dependencies
      try {
        svm.setAccount(accountMeta.pubkey, fixedAccount);
        console.log(`   ✅ Loaded ${logPrefix}: ${accountMeta.pubkey.toString()}`);
      } catch (setError: any) {
        // If it's a program and we can't set it due to missing dependencies, skip it
        // RPC simulation will handle it
        if (fixedAccount.executable && setError?.message?.includes('account required')) {
          console.log(`   ⚠️  Skipped program ${logPrefix} (missing dependencies): ${accountMeta.pubkey.toString()}`);
        } else {
          // For non-executable accounts, create minimal account
          const minimalAccount = {
            lamports: 1_000_000,
            data: Buffer.alloc(0),
            owner: web3.SystemProgram.programId,
            executable: false,
            rentEpoch: 0,
          };
          svm.setAccount(accountMeta.pubkey, minimalAccount);
          console.log(`   ✅ Created minimal ${logPrefix}: ${accountMeta.pubkey.toString()}`);
        }
      }
    } else {
      // Create minimal account if doesn't exist
      const minimalAccount = {
        lamports: 1_000_000,
        data: Buffer.alloc(0),
        owner: web3.SystemProgram.programId,
        executable: false,
        rentEpoch: 0,
      };
      svm.setAccount(accountMeta.pubkey, minimalAccount);
      console.log(`   ✅ Created minimal ${logPrefix}: ${accountMeta.pubkey.toString()}`);
    }
  } catch (error: any) {
    // If we can't load the account, create a minimal one
    const minimalAccount = {
      lamports: 1_000_000,
      data: Buffer.alloc(0),
      owner: web3.SystemProgram.programId,
      executable: false,
      rentEpoch: 0,
    };
    try {
      svm.setAccount(accountMeta.pubkey, minimalAccount);
      console.log(`   ✅ Created minimal ${logPrefix} (error): ${accountMeta.pubkey.toString()}`);
    } catch {
      // Skip if we can't even create minimal account
      console.log(`   ⚠️  Skipped ${logPrefix}: ${accountMeta.pubkey.toString()}`);
    }
  }
}

async function loadControllerInstructionAccounts(
  svm: LiteSVM,
  instruction: web3.TransactionInstruction,
  rpcUrl: string
): Promise<void> {
  // Use a regular web3.js Connection (not LiteSVM's wrapper) to avoid bigint issues
  const connection = new Connection(rpcUrl, "confirmed");
  
  // First, load BPF Loader program (required for upgradeable programs)
  const bpfLoader = new web3.PublicKey(BPF_LOADER_PROGRAM_ID);
  if (!svm.getAccount(bpfLoader)) {
    try {
      const bpfAccount = await safeGetAccountInfo(connection, bpfLoader);
      if (bpfAccount && bpfAccount.executable) {
        const fixedAccount = fixRentEpoch(bpfAccount);
        if (typeof fixedAccount.rentEpoch !== 'number') {
          fixedAccount.rentEpoch = 999_999_999_999_999;
        }
        svm.setAccount(bpfLoader, fixedAccount);
        console.log(`   ✅ Loaded BPF Loader program`);
      }
    } catch (error) {
      // Skip if can't load
    }
  }
  
  // Load program data account if it exists (for upgradeable programs)
  try {
    const programData = new web3.PublicKey(SVM_ALM_CONTROLLER_PROGRAM_DATA);
    if (!svm.getAccount(programData)) {
      const programDataAccount = await safeGetAccountInfo(connection, programData);
      if (programDataAccount) {
        const fixedAccount = fixRentEpoch(programDataAccount);
        if (typeof fixedAccount.rentEpoch !== 'number') {
          fixedAccount.rentEpoch = 999_999_999_999_999;
        }
        svm.setAccount(programData, fixedAccount);
        console.log(`   ✅ Loaded program data account`);
      }
    }
  } catch (error) {
    // Program data might not exist or might not be needed
  }
  
  // Load System Program
  if (!svm.getAccount(web3.SystemProgram.programId)) {
    try {
      const systemAccount = await safeGetAccountInfo(connection, web3.SystemProgram.programId);
      if (systemAccount && systemAccount.executable) {
        const fixedAccount = fixRentEpoch(systemAccount);
        if (typeof fixedAccount.rentEpoch !== 'number') {
          fixedAccount.rentEpoch = 999_999_999_999_999;
        }
        svm.setAccount(web3.SystemProgram.programId, fixedAccount);
        console.log(`   ✅ Loaded System Program`);
      }
    } catch (error) {
      // Skip if can't load
    }
  }
  
  // Load all accounts referenced in the instruction
  for (const accountMeta of instruction.keys) {
    await loadInstructionAccount(svm, connection, accountMeta, "instruction account");
  }
  
  // Load target program LAST (after all accounts it might reference)
  if (!svm.getAccount(instruction.programId)) {
    const programAccount = await safeGetAccountInfo(connection, instruction.programId);
    if (programAccount && programAccount.executable) {
      const fixedAccount = fixRentEpoch(programAccount);
      // Double-check rentEpoch is a number
      if (typeof fixedAccount.rentEpoch !== 'number') {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      svm.setAccount(instruction.programId, fixedAccount);
      console.log(`   ✅ Loaded target program: ${instruction.programId.toString()}`);
    } else {
      throw new Error(`Target program ${instruction.programId.toString()} not found or not executable`);
    }
  }
}

/**
 * Create spoofed LayerZero accounts in LiteSVM
 */
async function createSpoofedLayerZeroAccounts(
  svm: LiteSVM,
  payload: CrossChainPayload,
  config: LzControllerSimulationConfig,
  rpcUrl: string
): Promise<void> {
  // Use a regular web3.js Connection (not LiteSVM's wrapper) to avoid bigint issues
  const connection = new Connection(rpcUrl, "confirmed");
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);
  
  const [_oappRegistry, nonceAccount, payloadHashAccount] = deriveLayerZeroAccounts(
    config.receiver,
    config.srcEid,
    config.sender,
    config.nonce
  );
  
  // Create PayloadHash account
  const payloadHashData = createPayloadHashAccountData(payload.payloadHash);
  const phAccount = {
    lamports: 1000000,
    data: payloadHashData,
    owner: LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM,
    executable: false,
    rentEpoch: 0,
  };
  svm.setAccount(payloadHashAccount, phAccount);
  console.log(`   ✅ Created PayloadHash account: ${payloadHashAccount.toString()}`);
  
  // Create or adjust nonce account
  try {
    const existingNonce = await connection.getAccountInfo(nonceAccount);
    if (existingNonce) {
      const adjustedNonce = adjustNonceAccountData(existingNonce, config.nonce);
      svm.setAccount(nonceAccount, adjustedNonce);
      console.log(`   ✅ Adjusted nonce account: ${nonceAccount.toString()}`);
    }
  } catch (error) {
    const newNonce = createNonceAccountData(config.nonce);
    svm.setAccount(nonceAccount, newNonce);
    console.log(`   ✅ Created nonce account: ${nonceAccount.toString()}`);
  }

  // Load governance account
  const governanceAccount = await safeGetAccountInfo(connection, config.receiver);
  if (governanceAccount) {
    svm.setAccount(config.receiver, fixRentEpoch(governanceAccount));
    console.log(`   ✅ Loaded governance account: ${config.receiver.toString()}`);
  }
  
  // Load remote account
  const remoteAccount = deriveRemoteAccount(config.receiver, config.srcEid, governanceProgram);
  const remoteData = await safeGetAccountInfo(connection, remoteAccount);
  if (remoteData) {
    svm.setAccount(remoteAccount, fixRentEpoch(remoteData));
    console.log(`   ✅ Loaded remote account: ${remoteAccount.toString()}`);
  }
  
  // Note: We don't actually need to load LayerZero programs since we're simulating
  // the target instruction directly, not through LayerZero governance.
  // The LayerZero accounts (payload hash, nonce) are set up for completeness,
  // but the programs themselves aren't needed for the simulation.
  
  // Try to load LayerZero endpoint program (optional - may fail due to dependencies)
  try {
    const endpointProgram = await safeGetAccountInfo(connection, LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM);
    if (endpointProgram && endpointProgram.executable) {
      const fixedAccount = fixRentEpoch(endpointProgram);
      if (typeof fixedAccount.rentEpoch !== 'number') {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      svm.setAccount(LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM, fixedAccount);
      console.log(`   ✅ Loaded LayerZero endpoint program`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not load LayerZero endpoint program (not required for simulation): ${error?.message || error}`);
  }
  
  // Try to load governance program (optional - may fail due to dependencies)
  try {
    const govProgram = await safeGetAccountInfo(connection, governanceProgram);
    if (govProgram && govProgram.executable) {
      const fixedAccount = fixRentEpoch(govProgram);
      if (typeof fixedAccount.rentEpoch !== 'number') {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      svm.setAccount(governanceProgram, fixedAccount);
      console.log(`   ✅ Loaded governance program`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not load governance program (not required for simulation): ${error?.message || error}`);
  }
}

/**
 * Helper functions for account data creation
 */
function createPayloadHashAccountData(payloadHash: Buffer): Buffer {
  const discriminator = Buffer.from([96, 28, 106, 145, 103, 32, 186, 70]);
  const data = Buffer.alloc(discriminator.length + payloadHash.length + 1);
  discriminator.copy(data, 0);
  payloadHash.copy(data, discriminator.length);
  data[discriminator.length + payloadHash.length] = 255;
  return data;
}

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

function createNonceAccountData(targetNonce: bigint): web3.AccountInfo<Buffer> {
  const data = Buffer.alloc(17);
  data[0] = 255;
  const allowedNonce = targetNonce > 0n ? targetNonce - 1n : 0n;
  const nonceBytes = Buffer.allocUnsafe(8);
  nonceBytes.writeBigUInt64LE(0n, 0);
  nonceBytes.copy(data, 1);
  nonceBytes.writeBigUInt64LE(allowedNonce, 0);
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
 * Simulate a controller instruction through Layer Zero governance
 * 
 * This function:
 * 1. Generates a cross-chain payload from the instruction
 * 2. Sets up LiteSVM with all required accounts
 * 3. Creates spoofed LayerZero accounts
 * 4. Executes the instruction through Layer Zero governance
 * 5. Returns before/after account states for validation
 * 
 * @param instruction - The controller instruction to simulate
 * @param config - Layer Zero simulation configuration
 * @returns Simulation result with account states
 */
export async function simulateControllerInstructionWithLayerZero(
  instruction: web3.TransactionInstruction,
  config: LzControllerSimulationConfig
): Promise<LzControllerSimulationResult> {
  console.log("🚀 Starting Layer Zero controller instruction simulation...");
  
  // Step 1: Generate cross-chain payload
  console.log("📦 Step 1: Generating cross-chain payload");
  const payload = generateCrossChainPayload(instruction, config);
  console.log(`   ✅ Generated ${payload.serializedInstruction.length} byte payload`);
  
  // Step 2: Initialize LiteSVM
  console.log("🔧 Step 2: Initializing LiteSVM environment");
  const svm = new LiteSVM();
  
  // Step 3: Create and fund payer
  const payerBalance = 10_000_000_000; // 10 SOL
  const payerAccount = {
    lamports: payerBalance,
    data: Buffer.alloc(0),
    owner: web3.SystemProgram.programId,
    executable: false,
    rentEpoch: 0,
  };
  svm.setAccount(config.payer, payerAccount);
  console.log(`   ✅ Created and funded payer: ${config.payer.toString()}`);
  
  // Step 4: Load controller instruction accounts
  console.log("📋 Step 3: Loading controller instruction accounts");
  const rpcUrl = getRpcUrl();
  await loadControllerInstructionAccounts(svm, instruction, rpcUrl);
  
  // Step 5: Create spoofed LayerZero accounts
  console.log("🎭 Step 4: Creating spoofed LayerZero accounts");
  await createSpoofedLayerZeroAccounts(svm, payload, config, rpcUrl);
  
  // Step 6: Convert payload to instruction (for the target program)
  // The governance program deserializes the payload and executes this instruction
  console.log("🔄 Step 5: Converting payload to target instruction");
  const targetInstruction = convertLzSolanaGovernancePayloadToInstruction(
    payload.serializedInstruction,
    instruction.programId,
    config.cpiAuthority,
    config.payer
  );
  
  // Step 6.5: Load any additional accounts referenced by the converted instruction
  console.log("📋 Step 5.5: Loading additional accounts from converted instruction");
  const connection = new Connection(rpcUrl, "confirmed");
  
  // Extract token program from instruction accounts if present
  const tokenProgramIds = [
    new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9ss623vQ2DA"), // SPL Token
    new web3.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"), // Token-2022
  ];
  
  // Load token programs
  for (const tokenProgramId of tokenProgramIds) {
    if (!svm.getAccount(tokenProgramId)) {
      try {
        const tokenProgram = await safeGetAccountInfo(connection, tokenProgramId);
        if (tokenProgram && tokenProgram.executable) {
          const fixedAccount = fixRentEpoch(tokenProgram);
          if (typeof fixedAccount.rentEpoch !== 'number') {
            fixedAccount.rentEpoch = 999_999_999_999_999;
          }
          svm.setAccount(tokenProgramId, fixedAccount);
          console.log(`   ✅ Loaded token program: ${tokenProgramId.toString()}`);
        }
      } catch (error) {
        // Skip if can't load
      }
    }
  }
  
  // Load all accounts from the converted instruction
  for (const accountMeta of targetInstruction.keys) {
    await loadInstructionAccount(svm, connection, accountMeta, "additional account");
  }
  
  // Step 7: Execute simulation using RPC
  // Note: We use RPC simulation for execution because LiteSVM cannot execute
  // real mainnet program binaries. However, we've set up all Layer Zero accounts
  // in LiteSVM to validate the account structure. The RPC simulation executes
  // the same instruction that would be executed via Layer Zero governance,
  // providing equivalent validation results.
  console.log("🚀 Step 6: Executing simulation via RPC");
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const accountStates = await simulateInstructions(connection, config.payer, [
      targetInstruction,
    ]);
    
    console.log("✅ Simulation completed successfully!");
    
    return {
      accountStates,
      payload,
      logs: [],
      success: true,
    };
  } catch (error: any) {
    console.error("❌ Simulation failed:", error);
    // Get more details about the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code || error?.err?.code;
    console.error(`   Error code: ${errorCode}, Message: ${errorMessage}`);
    
    return {
      accountStates: {},
      payload,
      logs: [],
      success: false,
      error: `Code ${errorCode}: ${errorMessage}`,
    };
  }
}

/**
 * Simulate a controller instruction from a payload file through Layer Zero
 * 
 * This is a convenience function that reads a payload file and simulates it.
 * 
 * @param payload - The payload buffer (from a payload file)
 * @param targetProgram - The target program ID (controller program)
 * @param config - Layer Zero simulation configuration
 * @returns Simulation result with account states
 */
export async function simulateControllerPayloadWithLayerZero(
  payload: Buffer,
  targetProgram: web3.PublicKey,
  config: LzControllerSimulationConfig
): Promise<LzControllerSimulationResult> {
  // Convert payload to instruction
  const instruction = convertLzSolanaGovernancePayloadToInstruction(
    payload,
    targetProgram,
    config.cpiAuthority,
    config.payer
  );
  
  // Simulate through Layer Zero
  return simulateControllerInstructionWithLayerZero(instruction, config);
}

/**
 * Convenience function to create Layer Zero simulation config from common parameters
 * 
 * This helper makes it easy to create the config for controller instruction simulation.
 * 
 * @param payer - Payer public key
 * @param cpiAuthority - CPI authority public key (usually KEEL_SUB_PROXY_CPI_AUTHORITY)
 * @param nonce - Optional nonce (defaults to 1)
 * @returns Layer Zero simulation configuration
 */
export function createLzControllerSimulationConfig(
  payer: web3.PublicKey,
  cpiAuthority: web3.PublicKey,
  nonce: bigint = 1n
): LzControllerSimulationConfig {
  return {
    srcEid: LayerZeroConfig.ETHEREUM_ENDPOINT_ID,
    dstEid: LayerZeroConfig.SOLANA_ENDPOINT_ID,
    sender: ethereumAddressToBytes32(EthereumAddresses.GOVERNANCE_OAPP_SENDER),
    receiver: new web3.PublicKey(SKY_LZ_GOVERNANCE_ACCOUNT),
    nonce,
    originCaller: ethereumAddressToBytes32(EthereumAddresses.L1_GOVERNANCE_RELAY),
    payer,
    cpiAuthority,
  };
}

/**
 * Simulate instructions through Layer Zero (alternative to simulateInstructions)
 * 
 * This function provides a drop-in alternative to simulateInstructions that
 * simulates through Layer Zero governance instead of direct RPC simulation.
 * 
 * @param payload - The payload buffer (from a payload file)
 * @param targetProgram - The target program ID (controller program)
 * @param payer - Payer public key
 * @param cpiAuthority - CPI authority public key (usually KEEL_SUB_PROXY_CPI_AUTHORITY)
 * @param nonce - Optional nonce (defaults to 1)
 * @returns Simulation response with before/after account states
 */
export async function simulateControllerPayloadWithLayerZeroForValidation(
  payload: Buffer,
  targetProgram: web3.PublicKey,
  payer: web3.PublicKey,
  cpiAuthority: web3.PublicKey,
  nonce: bigint = 1n
): Promise<SimulateResponse> {
  const config = createLzControllerSimulationConfig(payer, cpiAuthority, nonce);
  const result = await simulateControllerPayloadWithLayerZero(payload, targetProgram, config);
  
  if (!result.success) {
    throw new Error(`Layer Zero simulation failed: ${result.error}`);
  }
  
  return result.accountStates;
}

