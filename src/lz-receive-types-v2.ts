/**
 * LayerZero V2 lz_receive types and utilities
 * 
 * This module provides types and functions for working with the
 * lz_receive_types_v2 instruction and account resolution.
 * 
 * Based on the Rust reference implementation at:
 * /Users/mattauer/src/xchain-gov-simulation/src/lz_receive_types.rs
 */

import { web3 } from "@coral-xyz/anchor";
import { createHash } from "crypto";
import { LiteSVM } from "litesvm";

/**
 * Parameters for lz_receive instruction (matches LayerZero SDK)
 */
export interface LzReceiveParams {
  srcEid: number;
  sender: Buffer;
  nonce: bigint;
  guid: Buffer;
  message: Buffer;
  extraData: Buffer;
}

/**
 * Output of the lz_receive_types_v2 instruction.
 * 
 * This structure enables the multi-instruction execution model where OApps can
 * define multiple instructions to be executed atomically by the Executor.
 */
export interface LzReceiveTypesV2Result {
  /** The version of context account */
  contextVersion: number;
  /** ALTs required for this execution context */
  alts: web3.PublicKey[];
  /** The complete list of instructions required for LzReceive execution */
  instructions: LzInstruction[];
}

/**
 * The list of instructions that can be executed in the LzReceive transaction.
 */
export type LzInstruction =
  | { type: "LzReceive"; accounts: ParsedAccountMetaWithLocator[] }
  | { type: "Standard"; programId: web3.PublicKey; accounts: ParsedAccountMetaWithLocator[]; data: Buffer };

/**
 * Account metadata for V2 execution planning.
 */
export interface AccountMetaRef {
  /** The account address locator */
  pubkey: AddressLocator;
  /** Whether the account is a signer */
  isSigner: boolean;
  /** Whether the account should be writable */
  isWritable: boolean;
}

/**
 * A generic account locator used in LZ execution planning for V2.
 * Can reference the address directly, via ALT, or as a placeholder.
 */
export type AddressLocator =
  | { type: "Address"; address: web3.PublicKey }
  | { type: "AltIndex"; altIndex: number; addressIndex: number }
  | { type: "Payer" }
  | { type: "Signer"; index: number }
  | { type: "Context" };

/**
 * Parsed execution plan from lz_receive_types_v2 return data
 */
export interface ParsedExecutionPlan {
  contextVersion: number;
  alts: web3.PublicKey[];
  instructions: ParsedInstructionInfo[];
}

/**
 * Parsed instruction information
 */
export type ParsedInstructionInfo = {
  type: "LzReceive";
  accounts: ParsedAccountMetaWithLocator[];
};

/**
 * Parsed account metadata with AddressLocator information
 */
export interface ParsedAccountMetaWithLocator {
  addressLocator: AddressLocator;
  pubkey: web3.PublicKey;
  isSigner: boolean;
  isWritable: boolean;
}

/**
 * Serialize LzReceiveParams to bytes (Borsh format)
 */
export function serializeLzReceiveParams(params: LzReceiveParams): Buffer {
  const parts: Buffer[] = [];
  
  // src_eid: u32 LE
  const srcEidBuf = Buffer.allocUnsafe(4);
  srcEidBuf.writeUInt32LE(params.srcEid, 0);
  parts.push(srcEidBuf);
  
  // sender: [u8; 32]
  parts.push(params.sender);
  
  // nonce: u64 LE
  const nonceBuf = Buffer.allocUnsafe(8);
  nonceBuf.writeBigUInt64LE(params.nonce, 0);
  parts.push(nonceBuf);
  
  // guid: [u8; 32]
  parts.push(params.guid);
  
  // message: Vec<u8> - length prefix (u32 LE) + data
  const messageLenBuf = Buffer.allocUnsafe(4);
  messageLenBuf.writeUInt32LE(params.message.length, 0);
  parts.push(messageLenBuf);
  parts.push(params.message);
  
  // extra_data: Vec<u8> - length prefix (u32 LE) + data
  const extraDataLenBuf = Buffer.allocUnsafe(4);
  extraDataLenBuf.writeUInt32LE(params.extraData.length, 0);
  parts.push(extraDataLenBuf);
  parts.push(params.extraData);
  
  return Buffer.concat(parts);
}

/**
 * Build lz_receive instruction data with Anchor discriminator
 */
export function buildLzReceiveInstructionData(params: LzReceiveParams): Buffer {
  // Calculate Anchor discriminator for lz_receive: SHA256("global:lz_receive")[0..8]
  const discriminator = createHash("sha256")
    .update("global:lz_receive")
    .digest()
    .subarray(0, 8);
  
  const paramsBytes = serializeLzReceiveParams(params);
  return Buffer.concat([discriminator, paramsBytes]);
}

/**
 * Build lz_receive_types_v2 instruction data with Anchor discriminator
 */
export function buildLzReceiveTypesV2InstructionData(params: LzReceiveParams): Buffer {
  // Calculate Anchor discriminator for lz_receive_types_v2
  const discriminator = createHash("sha256")
    .update("global:lz_receive_types_v2")
    .digest()
    .subarray(0, 8);
  
  const paramsBytes = serializeLzReceiveParams(params);
  return Buffer.concat([discriminator, paramsBytes]);
}

/**
 * Create lz_receive_types_v2 instruction
 */
export function createLzReceiveTypesV2Instruction(
  governanceProgram: web3.PublicKey,
  governanceAccount: web3.PublicKey,
  params: LzReceiveParams,
  alts: web3.PublicKey[] = []
): web3.TransactionInstruction {
  const instructionData = buildLzReceiveTypesV2InstructionData(params);
  
  const accounts: web3.AccountMeta[] = [
    { pubkey: governanceAccount, isSigner: false, isWritable: false },
  ];
  
  // Add ALT accounts as remaining accounts
  for (const alt of alts) {
    accounts.push({ pubkey: alt, isSigner: false, isWritable: false });
  }
  
  return new web3.TransactionInstruction({
    programId: governanceProgram,
    keys: accounts,
    data: instructionData,
  });
}

/**
 * Create lz_receive instruction
 */
export function createLzReceiveInstruction(
  governanceProgram: web3.PublicKey,
  accounts: web3.AccountMeta[],
  params: LzReceiveParams
): web3.TransactionInstruction {
  const instructionData = buildLzReceiveInstructionData(params);
  
  return new web3.TransactionInstruction({
    programId: governanceProgram,
    keys: accounts,
    data: instructionData,
  });
}

/**
 * Create LzReceiveParams from cross-chain config components
 */
export function createLzReceiveParams(
  srcEid: number,
  sender: Buffer,
  nonce: bigint,
  guid: Buffer,
  message: Buffer
): LzReceiveParams {
  return {
    srcEid,
    sender,
    nonce,
    guid,
    message,
    extraData: Buffer.alloc(0),
  };
}

/**
 * Parse the return data from lz_receive_types_v2 instruction
 */
export function parseLzReceiveTypesV2ReturnData(data: Buffer): ParsedExecutionPlan {
  if (data.length < 1) {
    throw new Error("Return data too short for context version");
  }
  
  let offset = 0;
  
  // Parse context version (1 byte)
  const contextVersion = data[offset];
  offset += 1;
  
  // Parse number of ALTs (4 bytes LE)
  if (data.length < offset + 4) {
    throw new Error("Return data too short for ALT count");
  }
  const altCount = data.readUInt32LE(offset);
  offset += 4;
  
  // Parse ALTs
  const alts: web3.PublicKey[] = [];
  for (let i = 0; i < altCount; i++) {
    if (data.length < offset + 32) {
      throw new Error(`Return data too short for ALT ${i}`);
    }
    
    const altBytes = data.subarray(offset, offset + 32);
    const altPubkey = new web3.PublicKey(altBytes);
    alts.push(altPubkey);
    offset += 32;
  }
  
  // Parse number of instructions (4 bytes LE)
  if (data.length < offset + 4) {
    throw new Error("Return data too short for instruction count");
  }
  const instructionCount = data.readUInt32LE(offset);
  offset += 4;
  
  // Parse instructions
  const instructions: ParsedInstructionInfo[] = [];
  for (let i = 0; i < instructionCount; i++) {
    // Parse instruction type (1 byte)
    if (data.length < offset + 1) {
      throw new Error(`Return data too short for instruction ${i} type`);
    }
    const instructionType = data[offset];
    offset += 1;
    
    if (instructionType === 0) {
      // LzReceive instruction
      // Parse number of accounts (4 bytes LE)
      if (data.length < offset + 4) {
        throw new Error(`Return data too short for instruction ${i} account count`);
      }
      const accountCount = data.readUInt32LE(offset);
      offset += 4;
      
      // Parse accounts
      const accounts: ParsedAccountMetaWithLocator[] = [];
      
      for (let j = 0; j < accountCount; j++) {
        const remainingData = data.length - offset;
        
        if (remainingData < 2) {
          break;
        }
        
        // Read AddressLocator discriminator
        const discriminator = data[offset];
        offset += 1;
        
        // Parse AddressLocator based on discriminator
        let addressLocator: AddressLocator;
        let pubkey: web3.PublicKey;
        
        switch (discriminator) {
          case 0: {
            // Address(Pubkey) - need 32 bytes for pubkey
            if (data.length - offset < 32) {
              throw new Error(`Not enough data for Address pubkey in account ${j}`);
            }
            const pubkeyBytes = data.subarray(offset, offset + 32);
            pubkey = new web3.PublicKey(pubkeyBytes);
            offset += 32;
            addressLocator = { type: "Address", address: pubkey };
            break;
          }
          case 1: {
            // AltIndex(u8, u8) - need 2 bytes
            if (data.length - offset < 2) {
              throw new Error(`Not enough data for AltIndex in account ${j}`);
            }
            const altIndex = data[offset];
            const addressIndex = data[offset + 1];
            offset += 2;
            addressLocator = { type: "AltIndex", altIndex, addressIndex };
            pubkey = web3.Keypair.generate().publicKey; // Placeholder
            break;
          }
          case 2: {
            // Payer - no additional data
            addressLocator = { type: "Payer" };
            pubkey = web3.Keypair.generate().publicKey; // Placeholder
            break;
          }
          case 3: {
            // Signer(u8) - need 1 byte
            if (data.length - offset < 1) {
              throw new Error(`Not enough data for Signer index in account ${j}`);
            }
            const signerIndex = data[offset];
            offset += 1;
            addressLocator = { type: "Signer", index: signerIndex };
            pubkey = web3.Keypair.generate().publicKey; // Placeholder
            break;
          }
          case 4: {
            // Context - no additional data
            addressLocator = { type: "Context" };
            pubkey = web3.Keypair.generate().publicKey; // Placeholder
            break;
          }
          default:
            throw new Error(`Unknown AddressLocator discriminator: ${discriminator} for account ${j}`);
        }
        
        // Read is_writable flag (1 byte boolean)
        // Note: is_signer is determined by the AddressLocator type (Payer and Signer are signers)
        if (data.length - offset < 1) {
          throw new Error(`Not enough data for is_writable flag in account ${j}`);
        }
        const isWritable = data[offset] !== 0;
        offset += 1;
        
        // Determine is_signer from AddressLocator type
        const isSigner = addressLocator.type === "Payer" || addressLocator.type === "Signer";
        
        const parsedAccount: ParsedAccountMetaWithLocator = {
          addressLocator,
          pubkey,
          isSigner,
          isWritable,
        };
        
        accounts.push(parsedAccount);
      }
      
      instructions.push({ type: "LzReceive", accounts });
    } else {
      throw new Error(`Unknown instruction type: ${instructionType}`);
    }
  }
  
  return {
    contextVersion,
    alts,
    instructions,
  };
}

/**
 * Convert parsed account metadata to AccountMeta by resolving AddressLocator
 */
export function resolveAccountMeta(
  accountRef: ParsedAccountMetaWithLocator,
  payer: web3.PublicKey,
  context?: web3.PublicKey,
  alts?: web3.PublicKey[]
): web3.AccountMeta {
  let pubkey: web3.PublicKey;
  // Use the signer status from the execution plan, but Payer is always a signer
  let isSigner = accountRef.isSigner;
  
  switch (accountRef.addressLocator.type) {
    case "Address":
      pubkey = accountRef.addressLocator.address;
      break;
    case "Payer":
      pubkey = payer;
      isSigner = true; // Payer is always a signer
      break;
    case "AltIndex":
      // For simulation, use a placeholder
      pubkey = web3.Keypair.generate().publicKey;
      break;
    case "Signer":
      // Signer type means this account should be a signer
      isSigner = true;
      pubkey = payer; // Use payer as the signer for simulation
      break;
    case "Context":
      if (context) {
        pubkey = context;
      } else {
        // Create placeholder context account
        pubkey = web3.Keypair.generate().publicKey;
      }
      break;
    default:
      throw new Error(`Unknown AddressLocator type`);
  }
  
  return {
    pubkey,
    isSigner,
    isWritable: accountRef.isWritable,
  };
}

/**
 * Debug account context in LiteSVM
 */
export function debugAccountContext(svm: LiteSVM, pubkey: web3.PublicKey, name: string): void {
  const account = svm.getAccount(pubkey);
  if (account) {
    console.log(`   📋 ${name} (${pubkey.toString()}): EXISTS`);
    console.log(`      ├─ Lamports: ${account.lamports}`);
    console.log(`      ├─ Owner: ${account.owner.toString()}`);
    console.log(`      ├─ Data length: ${account.data.length} bytes`);
    console.log(`      ├─ Executable: ${account.executable}`);
    console.log(`      └─ Rent epoch: ${account.rentEpoch}`);
    
    if (account.data.length > 0) {
      const preview = Buffer.from(account.data.slice(0, Math.min(32, account.data.length)));
      console.log(`      └─ Data preview: 0x${preview.toString('hex')}`);
    }
  } else {
    console.log(`   ❌ ${name} (${pubkey.toString()}): NOT FOUND`);
  }
}

/**
 * Simulate lz_receive_types_v2 instruction to get account resolution
 * 
 * This function executes the lz_receive_types_v2 instruction in LiteSVM
 * and parses the return data to get the execution plan with account resolution.
 */
export async function simulateLzReceiveTypesV2(
  svm: LiteSVM,
  governanceProgram: web3.PublicKey,
  governanceAccount: web3.PublicKey,
  params: LzReceiveParams,
  payer: web3.Keypair
): Promise<LzReceiveTypesV2Result> {
  console.log("\n🔍 === LZ_RECEIVE_TYPES_V2 SIMULATION ===");
  console.log("📋 INPUT PARAMETERS:");
  console.log(`   Governance Program: ${governanceProgram.toString()}`);
  console.log(`   Governance Account: ${governanceAccount.toString()}`);
  console.log(`   Source EID: ${params.srcEid}`);
  console.log(`   Sender: 0x${params.sender.toString("hex")}`);
  console.log(`   Nonce: ${params.nonce}`);
  console.log(`   GUID: 0x${params.guid.toString("hex")}`);
  console.log(`   Message Length: ${params.message.length} bytes`);
  console.log(`   Message (first 64 bytes): 0x${params.message.subarray(0, Math.min(64, params.message.length)).toString("hex")}`);
  
  // Check if governance program is loaded
  console.log("\n🔎 === ACCOUNT CONTEXT BEFORE lz_receive_types_v2 ===");
  debugAccountContext(svm, governanceProgram, "Governance Program");
  debugAccountContext(svm, governanceAccount, "Governance Account");
  debugAccountContext(svm, web3.SystemProgram.programId, "System Program");
  
  const programAccount = svm.getAccount(governanceProgram);
  if (!programAccount) {
    throw new Error(`Governance program not loaded at ${governanceProgram.toString()} - cannot get real execution plan`);
  }
  
  console.log("\n🚀 ATTEMPTING REAL lz_receive_types_v2 EXECUTION");
  
  // Create the lz_receive_types_v2 instruction
  const instruction = createLzReceiveTypesV2Instruction(
    governanceProgram,
    governanceAccount,
    params,
    [] // No ALTs for now
  );
  
  console.log("📋 lz_receive_types_v2 instruction details:");
  console.log(`   Program: ${instruction.programId.toString()}`);
  console.log(`   Data length: ${instruction.data.length} bytes`);
  console.log(`   Data: 0x${instruction.data.toString("hex")}`);
  console.log(`   Accounts: ${instruction.keys.length}`);
  for (let i = 0; i < instruction.keys.length; i++) {
    const acc = instruction.keys[i];
    console.log(`   [${i}] ${acc.pubkey.toString()} (signer: ${acc.isSigner}, writable: ${acc.isWritable})`);
    debugAccountContext(svm, acc.pubkey, `Instruction Account [${i}]`);
  }
  
  // Fund the payer account
  const payerPubkey = payer.publicKey;
  console.log(`\n💰 Ensuring payer account is funded: ${payerPubkey.toString()}`);
  const payerAccount = svm.getAccount(payerPubkey);
  if (!payerAccount || payerAccount.lamports < 1_000_000_000) {
    svm.setAccount(payerPubkey, {
      lamports: 10_000_000_000,
      data: Buffer.alloc(0),
      owner: web3.SystemProgram.programId,
      executable: false,
      rentEpoch: 0,
    });
    console.log("✅ Payer funded with 10 SOL");
  }
  
  // Build and send transaction
  console.log("\n🏃 Executing lz_receive_types_v2 instruction...");
  const blockhash = svm.latestBlockhash();
  console.log(`   🔗 Using LiteSVM blockhash: ${blockhash}`);
  
  const messageV0 = new web3.TransactionMessage({
    payerKey: payerPubkey,
    recentBlockhash: blockhash,
    instructions: [instruction],
  }).compileToV0Message();
  
  const transaction = new web3.VersionedTransaction(messageV0);
  transaction.sign([payer]);
  
  const result = svm.sendTransaction(transaction);
  
  // Check if it's a failure
  if ('meta' in result && 'err' in result) {
    // Failed transaction
    const logs = result.meta().logs();
    console.log("❌ lz_receive_types_v2 execution failed!");
    console.log(`📜 ERROR LOGS (${logs.length} entries):`);
    for (let i = 0; i < logs.length; i++) {
      console.log(`   [${i + 1}] ${logs[i]}`);
    }
    console.log(`🔥 Error: ${result.err()}`);
    
    throw new Error(`lz_receive_types_v2 execution failed: ${result.err()}`);
  }
  
  // Success
  const logs = result.logs();
  console.log("✅ lz_receive_types_v2 executed successfully!");
  console.log(`📜 EXECUTION LOGS (${logs.length} entries):`);
  for (let i = 0; i < logs.length; i++) {
    console.log(`   [${i + 1}] ${logs[i]}`);
  }
  
  // Get return data
  const returnData = result.returnData();
  if (!returnData) {
    throw new Error("No return data from lz_receive_types_v2");
  }
  
  // Convert return data to Buffer (litesvm's TransactionReturnData.data() returns Uint8Array)
  const dataBytes = returnData.data();
  const returnDataBuffer = Buffer.from(dataBytes);
  if (returnDataBuffer.length === 0) {
    throw new Error("Empty return data from lz_receive_types_v2");
  }
  
  console.log(`📦 Return data length: ${returnDataBuffer.length} bytes`);
  console.log(`📦 Return data (hex): 0x${returnDataBuffer.toString("hex")}`);
  
  // Parse the execution plan from return data
  console.log("\n📋 === PARSING lz_receive_types_v2 EXECUTION PLAN ===");
  const executionPlan = parseLzReceiveTypesV2ReturnData(returnDataBuffer);
  
  console.log("✅ Successfully parsed execution plan:");
  console.log(`   Context Version: ${executionPlan.contextVersion}`);
  console.log(`   ALTs: ${executionPlan.alts.length} address lookup tables`);
  console.log(`   Instructions: ${executionPlan.instructions.length} instructions`);
  
  for (let i = 0; i < executionPlan.alts.length; i++) {
    console.log(`   ALT[${i}]: ${executionPlan.alts[i].toString()}`);
  }
  
  for (let i = 0; i < executionPlan.instructions.length; i++) {
    const inst = executionPlan.instructions[i];
    if (inst.type === "LzReceive") {
      console.log(`   Instruction[${i}]: lz_receive with ${inst.accounts.length} accounts:`);
      for (let j = 0; j < inst.accounts.length; j++) {
        const acc = inst.accounts[j];
        console.log(`      [${j}] ${JSON.stringify(acc.addressLocator)} | ${acc.pubkey.toString()} (writable: ${acc.isWritable})`);
      }
    }
  }
  
  console.log("\n✅ Using REAL execution plan from lz_receive_types_v2\n");
  
  // Convert ParsedExecutionPlan to LzReceiveTypesV2Result
  return {
    contextVersion: executionPlan.contextVersion,
    alts: executionPlan.alts,
    instructions: executionPlan.instructions.map((inst) => {
      if (inst.type === "LzReceive") {
        return {
          type: "LzReceive" as const,
          accounts: inst.accounts.map((acc, i) => {
            console.log(`   🔑 Account[${i}]: ${JSON.stringify(acc.addressLocator)} (original pubkey: ${acc.pubkey.toString()}, signer: ${acc.isSigner}, writable: ${acc.isWritable})`);
            return acc; // Pass through the full ParsedAccountMetaWithLocator
          }),
        };
      }
      throw new Error("Unexpected instruction type");
    }),
  };
}
