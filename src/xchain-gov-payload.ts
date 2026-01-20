/**
 * Generic cross-chain payload builder for LayerZero governance messages
 * 
 * This module provides a generic, reusable framework for creating cross-chain
 * governance payloads that can execute arbitrary Solana instructions via LayerZero.
 */

import { web3 } from "@coral-xyz/anchor";
import { createHash } from "crypto";
import keccak from "keccak";
import {
  convertInstructionToSolanaGovernancePayload,
} from "./lz/lz-governance-codec";

/**
 * Configuration for cross-chain governance simulation
 */
export interface CrossChainConfig {
  /** Source endpoint ID (e.g., Ethereum mainnet = 30101) */
  srcEid: number;
  /** Destination endpoint ID (e.g., Solana mainnet = 30168) */
  dstEid: number;
  /** Ethereum OApp sender address (32 bytes) */
  sender: Uint8Array; // 32 bytes
  /** Solana governance OApp receiver */
  receiver: web3.PublicKey;
  /** LayerZero message nonce */
  nonce: bigint;
  /** Origin caller address (e.g., L1 Governance Relay) */
  originCaller: Uint8Array; // 32 bytes
}

/**
 * Complete cross-chain payload result
 */
export interface CrossChainPayload {
  /** The complete governance message for lz_receive */
  message: Buffer;
  /** Keccak256 hash of GUID + message */
  payloadHash: Buffer; // 32 bytes
  /** LayerZero GUID for this message */
  guid: Buffer; // 32 bytes
  /** Serialized instruction for Ethereum side */
  serializedInstruction: Buffer;
}

/**
 * Generate deterministic GUID for LayerZero message
 */
export function generateGuid(
  srcEid: number,
  sender: Uint8Array,
  receiver: web3.PublicKey,
  nonce: bigint
): Buffer {
  const hasher = createHash("sha256");
  const srcEidBytes = Buffer.alloc(4);
  srcEidBytes.writeUInt32BE(srcEid, 0);
  hasher.update(srcEidBytes);
  hasher.update(Buffer.from(sender));
  hasher.update(receiver.toBuffer());
  const nonceBytes = Buffer.alloc(8);
  nonceBytes.writeBigUInt64BE(nonce, 0);
  hasher.update(nonceBytes);
  return hasher.digest();
}

/**
 * Calculate LayerZero payload hash using Keccak256(GUID + message)
 */
export function calculatePayloadHash(guid: Buffer, message: Buffer): Buffer {
  const hasher = keccak("keccak256");
  hasher.update(guid);
  hasher.update(message);
  return Buffer.from(hasher.digest());
}

/**
 * Build complete LayerZero governance message in wire format
 * 
 * Format: [origin_caller:32][target_program:32][instruction_data:*]
 */
export function buildGovernanceMessage(
  originCaller: Uint8Array,
  targetProgram: web3.PublicKey,
  instructionData: Buffer
): Buffer {
  const message = Buffer.alloc(64 + instructionData.length);
  Buffer.from(originCaller).copy(message, 0);
  targetProgram.toBuffer().copy(message, 32);
  instructionData.copy(message, 64);
  return message;
}

/**
 * Generate complete cross-chain payload from any Solana instruction
 * 
 * This is the main entry point for the generic framework.
 * It takes any Solana instruction and cross-chain config, then returns
 * everything needed for simulation on both Ethereum and Solana sides.
 */
export function generateCrossChainPayload(
  instruction: web3.TransactionInstruction,
  config: CrossChainConfig
): CrossChainPayload {
  // 1. Serialize the Solana instruction
  const serializedInstruction = convertInstructionToSolanaGovernancePayload(instruction);
  
  // 2. Build the complete governance message
  const message = buildGovernanceMessage(
    config.originCaller,
    instruction.programId,
    serializedInstruction
  );
  
  // 3. Generate deterministic GUID
  const guid = generateGuid(
    config.srcEid,
    config.sender,
    config.receiver,
    config.nonce
  );
  
  // 4. Calculate payload hash using LayerZero's method
  const payloadHash = calculatePayloadHash(guid, message);
  
  return {
    message,
    payloadHash,
    guid,
    serializedInstruction,
  };
}

/**
 * Extract target program ID from a governance message
 */
export function extractTargetProgram(message: Buffer): web3.PublicKey {
  if (message.length < 64) {
    throw new Error("Message too short for target program");
  }
  
  const programBytes = message.subarray(32, 64);
  return new web3.PublicKey(programBytes);
}

/**
 * Extract origin caller from a governance message
 */
export function extractOriginCaller(message: Buffer): Buffer {
  if (message.length < 32) {
    throw new Error("Message too short for origin caller");
  }
  
  return message.subarray(0, 32);
}

/**
 * Extract instruction data from a governance message
 */
export function extractInstructionData(message: Buffer): Buffer {
  if (message.length < 64) {
    throw new Error("Message too short for instruction data");
  }
  
  return message.subarray(64);
}

/**
 * Utility to validate a governance message format
 */
export function validateGovernanceMessage(message: Buffer): void {
  if (message.length < 66) {
    throw new Error(
      `Governance message too short: ${message.length} bytes (minimum 66)`
    );
  }
  
  // Validate we can extract basic components
  extractOriginCaller(message);
  extractTargetProgram(message);
  const instructionData = extractInstructionData(message);
  
  // Basic validation of instruction data format
  if (instructionData.length < 2) {
    throw new Error("Instruction data too short");
  }
}

