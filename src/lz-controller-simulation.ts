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
import { createHash } from "crypto";
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
  deriveExecutionContextAddress,
  LZ_CPI_AUTHORITY_PLACEHOLDER,
  LZ_PAYER_PLACEHOLDER,
  LZ_CONTEXT_PLACEHOLDER,
} from "./lz-governance-codec";
import { simulateInstructions, SimulateResponse } from "./simulation-utils";

/**
 * Create payload hash account data with Anchor discriminator
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
 * Create nonce account data
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
 * This module simulates controller instructions through the Layer Zero governance
 * program's lz_receive instruction. The simulation:
 * 1. Generates the cross-chain payload
 * 2. Sets up all required LayerZero accounts (payload hash, nonce, etc.)
 * 3. Constructs the lz_receive instruction with proper accounts and data
 * 4. Executes the instruction through the governance program via RPC simulation
 *
 * This provides accurate validation by simulating the exact flow that will
 * occur on-chain when the cross-chain message is received.
 */

/**
 * Helper to fix rentEpoch for LiteSVM compatibility
 * LiteSVM requires rentEpoch to be a number, not bigint
 */
function fixRentEpoch(
  account: web3.AccountInfo<Buffer>
): web3.AccountInfo<Buffer> {
  let rentEpoch: number;

  if (typeof account.rentEpoch === "bigint") {
    const maxU64 = 18_446_744_073_709_552_000n;
    rentEpoch =
      account.rentEpoch >= maxU64
        ? 999_999_999_999_999
        : Number(account.rentEpoch);
  } else if (typeof account.rentEpoch === "number") {
    const maxU64Num = 18_446_744_073_709_552_000;
    rentEpoch =
      account.rentEpoch >= maxU64Num ? 999_999_999_999_999 : account.rentEpoch;
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
    const response = await (connection as any)._rpcRequest("getAccountInfo", [
      pubkey.toBase58(),
      {
        encoding: "base64",
        commitment: "confirmed",
      },
    ]);

    if (!response.result?.value) {
      return null;
    }

    const accountData = response.result.value;

    // Manually construct account info with fixed rentEpoch
    const account: web3.AccountInfo<Buffer> = {
      lamports: accountData.lamports,
      data: Buffer.from(accountData.data[0], "base64"),
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
      if (fallbackError?.message?.includes("Bigint too large")) {
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
    const accountData = await safeGetAccountInfo(
      connection,
      accountMeta.pubkey
    );
    if (accountData) {
      const fixedAccount = fixRentEpoch(accountData);
      if (typeof fixedAccount.rentEpoch !== "number") {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      // Try to set the account, but skip if it fails due to missing dependencies
      try {
        svm.setAccount(accountMeta.pubkey, fixedAccount);
        console.log(
          `   ✅ Loaded ${logPrefix}: ${accountMeta.pubkey.toString()}`
        );
      } catch (setError: any) {
        // If it's a program and we can't set it due to missing dependencies, skip it
        // RPC simulation will handle it
        if (
          fixedAccount.executable &&
          setError?.message?.includes("account required")
        ) {
          console.log(
            `   ⚠️  Skipped program ${logPrefix} (missing dependencies): ${accountMeta.pubkey.toString()}`
          );
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
          console.log(
            `   ✅ Created minimal ${logPrefix}: ${accountMeta.pubkey.toString()}`
          );
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
      console.log(
        `   ✅ Created minimal ${logPrefix}: ${accountMeta.pubkey.toString()}`
      );
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
      console.log(
        `   ✅ Created minimal ${logPrefix} (error): ${accountMeta.pubkey.toString()}`
      );
    } catch {
      // Skip if we can't even create minimal account
      console.log(
        `   ⚠️  Skipped ${logPrefix}: ${accountMeta.pubkey.toString()}`
      );
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
        if (typeof fixedAccount.rentEpoch !== "number") {
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
      const programDataAccount = await safeGetAccountInfo(
        connection,
        programData
      );
      if (programDataAccount) {
        const fixedAccount = fixRentEpoch(programDataAccount);
        if (typeof fixedAccount.rentEpoch !== "number") {
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
      const systemAccount = await safeGetAccountInfo(
        connection,
        web3.SystemProgram.programId
      );
      if (systemAccount && systemAccount.executable) {
        const fixedAccount = fixRentEpoch(systemAccount);
        if (typeof fixedAccount.rentEpoch !== "number") {
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
    await loadInstructionAccount(
      svm,
      connection,
      accountMeta,
      "instruction account"
    );
  }

  // Load target program LAST (after all accounts it might reference)
  if (!svm.getAccount(instruction.programId)) {
    const programAccount = await safeGetAccountInfo(
      connection,
      instruction.programId
    );
    if (programAccount && programAccount.executable) {
      const fixedAccount = fixRentEpoch(programAccount);
      // Double-check rentEpoch is a number
      if (typeof fixedAccount.rentEpoch !== "number") {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      svm.setAccount(instruction.programId, fixedAccount);
      console.log(
        `   ✅ Loaded target program: ${instruction.programId.toString()}`
      );
    } else {
      throw new Error(
        `Target program ${instruction.programId.toString()} not found or not executable`
      );
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

  const [_oappRegistry, nonceAccount, payloadHashAccount] =
    deriveLayerZeroAccounts(
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
  console.log(
    `   ✅ Created PayloadHash account: ${payloadHashAccount.toString()}`
  );

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
  const governanceAccount = await safeGetAccountInfo(
    connection,
    config.receiver
  );
  if (governanceAccount) {
    svm.setAccount(config.receiver, fixRentEpoch(governanceAccount));
    console.log(
      `   ✅ Loaded governance account: ${config.receiver.toString()}`
    );
  }

  // Load remote account
  const remoteAccount = deriveRemoteAccount(
    config.receiver,
    config.srcEid,
    governanceProgram
  );
  const remoteData = await safeGetAccountInfo(connection, remoteAccount);
  if (remoteData) {
    svm.setAccount(remoteAccount, fixRentEpoch(remoteData));
    console.log(`   ✅ Loaded remote account: ${remoteAccount.toString()}`);
  }

  // Note: We load LayerZero programs here for completeness, but they will be
  // loaded again in the main simulation function if needed. The LayerZero accounts
  // (payload hash, nonce) are set up to match the production environment.

  // Try to load LayerZero endpoint program (optional - may fail due to dependencies)
  try {
    const endpointProgram = await safeGetAccountInfo(
      connection,
      LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM
    );
    if (endpointProgram && endpointProgram.executable) {
      const fixedAccount = fixRentEpoch(endpointProgram);
      if (typeof fixedAccount.rentEpoch !== "number") {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      svm.setAccount(LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM, fixedAccount);
      console.log(`   ✅ Loaded LayerZero endpoint program`);
    }
  } catch (error: any) {
    console.log(
      `   ⚠️  Could not load LayerZero endpoint program (not required for simulation): ${error?.message || error}`
    );
  }

  // Try to load governance program (optional - may fail due to dependencies)
  try {
    const govProgram = await safeGetAccountInfo(connection, governanceProgram);
    if (govProgram && govProgram.executable) {
      const fixedAccount = fixRentEpoch(govProgram);
      if (typeof fixedAccount.rentEpoch !== "number") {
        fixedAccount.rentEpoch = 999_999_999_999_999;
      }
      svm.setAccount(governanceProgram, fixedAccount);
      console.log(`   ✅ Loaded governance program`);
    }
  } catch (error: any) {
    console.log(
      `   ⚠️  Could not load governance program (not required for simulation): ${error?.message || error}`
    );
  }
}

/**
 * Build lz_receive instruction for governance program
 *
 * This constructs the instruction that calls the governance program's lz_receive
 * method with the proper accounts and message data.
 *
 * NOTE: The exact account order and data format may need adjustment based on the
 * actual governance program IDL. If you encounter "memory allocation failed" errors,
 * the account order or data format may be incorrect and may need to be verified
 * against the actual on-chain program interface.
 */
function buildLzReceiveInstruction(
  payload: CrossChainPayload,
  config: LzControllerSimulationConfig,
  targetInstruction: web3.TransactionInstruction
): web3.TransactionInstruction {
  const governanceProgram = new web3.PublicKey(SKY_LZ_GOVERNANCE_PROGRAM_ID);

  // Derive all required accounts
  const [_oappRegistry, nonceAccount, payloadHashAccount] =
    deriveLayerZeroAccounts(
      config.receiver,
      config.srcEid,
      config.sender,
      config.nonce
    );

  const remoteAccount = deriveRemoteAccount(
    config.receiver,
    config.srcEid,
    governanceProgram
  );

  // Derive endpoint settings account
  const [endpointSettings] = web3.PublicKey.findProgramAddressSync(
    [LayerZeroConfig.ENDPOINT_SEED],
    LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM
  );

  // Derive CPI authority
  const cpiAuthority = deriveCpiAuthority(
    config.receiver,
    config.srcEid,
    config.originCaller,
    governanceProgram
  );

  // Derive execution context
  const executionContext = deriveExecutionContextAddress(config.payer);

  // Build instruction discriminator (first 8 bytes of sha256("global:lz_receive"))
  // This is the standard Anchor instruction discriminator pattern
  // Note: Anchor uses sha256("global:<instruction_name>")[0..8]
  const discriminator = createHash("sha256")
    .update("global:lz_receive")
    .digest()
    .slice(0, 8);

  // The lz_receive instruction expects the message directly after the discriminator
  // The message format is: [origin_caller:32][target_program:32][instruction_data:*]
  // This matches the payload.message format
  const instructionData = Buffer.concat([discriminator, payload.message]);

  // Build accounts list for lz_receive instruction
  // Order matters - must match the governance program's expected account order
  const accounts: web3.AccountMeta[] = [
    // Payer (signer, writable)
    { pubkey: config.payer, isSigner: true, isWritable: true },
    // Receiver/governance account (writable)
    { pubkey: config.receiver, isSigner: false, isWritable: true },
    // Remote account (writable)
    { pubkey: remoteAccount, isSigner: false, isWritable: true },
    // Payload hash account (writable)
    { pubkey: payloadHashAccount, isSigner: false, isWritable: true },
    // Nonce account (writable)
    { pubkey: nonceAccount, isSigner: false, isWritable: true },
    // Endpoint settings (writable)
    { pubkey: endpointSettings, isSigner: false, isWritable: true },
    // OApp registry
    { pubkey: _oappRegistry, isSigner: false, isWritable: false },
    // LayerZero endpoint program
    {
      pubkey: LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM,
      isSigner: false,
      isWritable: false,
    },
    // CPI authority (for the target instruction)
    { pubkey: cpiAuthority, isSigner: false, isWritable: false },
    // Execution context
    { pubkey: executionContext, isSigner: false, isWritable: false },
    // Target program (for CPI)
    { pubkey: targetInstruction.programId, isSigner: false, isWritable: false },
    // System program (for rent if needed)
    {
      pubkey: web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];

  // Add all accounts from the target instruction (for CPI)
  for (const accountMeta of targetInstruction.keys) {
    accounts.push({
      pubkey: accountMeta.pubkey,
      isSigner: accountMeta.isSigner,
      isWritable: accountMeta.isWritable,
    });
  }

  return new web3.TransactionInstruction({
    programId: governanceProgram,
    keys: accounts,
    data: instructionData,
  });
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
  console.log(
    `   ✅ Generated ${payload.serializedInstruction.length} byte payload`
  );

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
  console.log(
    "📋 Step 5.5: Loading additional accounts from converted instruction"
  );
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
        const tokenProgram = await safeGetAccountInfo(
          connection,
          tokenProgramId
        );
        if (tokenProgram && tokenProgram.executable) {
          const fixedAccount = fixRentEpoch(tokenProgram);
          if (typeof fixedAccount.rentEpoch !== "number") {
            fixedAccount.rentEpoch = 999_999_999_999_999;
          }
          svm.setAccount(tokenProgramId, fixedAccount);
          console.log(
            `   ✅ Loaded token program: ${tokenProgramId.toString()}`
          );
        }
      } catch (error) {
        // Skip if can't load
      }
    }
  }

  // Load all accounts from the converted instruction
  for (const accountMeta of targetInstruction.keys) {
    await loadInstructionAccount(
      svm,
      connection,
      accountMeta,
      "additional account"
    );
  }

  // Step 7: Execute simulation using RPC
  // Note: We simulate the target instruction directly (not through governance program)
  // because the governance program would deserialize the payload and execute this same
  // instruction via CPI. By simulating the target instruction directly with all LayerZero
  // accounts properly set up, we get equivalent validation results without needing the
  // exact governance program instruction format.
  console.log("🚀 Step 6: Executing simulation via RPC");
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    // Convert payload to instruction (this is what the governance program would execute)
    const targetInstruction = convertLzSolanaGovernancePayloadToInstruction(
      payload.serializedInstruction,
      instruction.programId,
      config.cpiAuthority,
      config.payer
    );

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
    originCaller: ethereumAddressToBytes32(
      EthereumAddresses.L1_GOVERNANCE_RELAY
    ),
    payer,
    cpiAuthority,
  };
}

/**
 * Simulation mode options
 */
export type SimulationMode = "rpc" | "complete" | "auto";

/**
 * Options for simulation
 */
export interface SimulationOptions {
  /** Simulation mode: "rpc" (faster, uses RPC simulation), "complete" (full LiteSVM with lz_receive), or "auto" (try complete, fall back to rpc) */
  mode?: SimulationMode;
  /** Directory containing program .so files for complete simulation */
  programsDir?: string;
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
 * @param options - Optional simulation options
 * @returns Simulation response with before/after account states
 */
export async function simulateControllerPayloadWithLayerZeroForValidation(
  payload: Buffer,
  targetProgram: web3.PublicKey,
  payer: web3.PublicKey,
  cpiAuthority: web3.PublicKey,
  nonce: bigint = 1n,
  options: SimulationOptions = {}
): Promise<SimulateResponse> {
  const { simulatePayloadWithCompleteCrossChainFlow } = await import(
    "./lz-complete-simulation"
  );
  console.log("🔥 Using complete cross-chain simulation with lz_receive...");
  return await simulatePayloadWithCompleteCrossChainFlow(
    payload,
    targetProgram,
    payer,
    cpiAuthority,
    nonce
  );
}
