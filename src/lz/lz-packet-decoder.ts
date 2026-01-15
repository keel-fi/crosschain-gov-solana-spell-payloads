/**
 * LayerZero Packet Decoder
 * 
 * This module provides utilities to decode full LayerZero Packets
 * and extract the governance payload for simulation.
 */

import { Buffer } from "buffer";
import { LzReceiveParams } from "./lz-receive-types-v2";
import { extractInstructionData } from "../xchain-gov-payload";
import { hexStringToBytes } from "../utils";

/**
 * Decode a LayerZero Packet from raw bytes
 * 
 * The Packet format (PacketV1):
 * - Version (offset 0, 1 byte): Always 0x01 for PacketV1
 * - Nonce (offset 1, 8 bytes): Message nonce (uint64, big-endian)
 * - SrcEID (offset 9, 4 bytes): Source endpoint ID (uint32, big-endian)
 * - Sender (offset 13, 32 bytes): Sender address as bytes32
 * - DstEID (offset 45, 4 bytes): Destination endpoint ID (uint32, big-endian)
 * - Receiver (offset 49, 32 bytes): Receiver address as bytes32
 * - GUID (offset 81, 32 bytes): keccak256(nonce + path)
 * - Message (offset 113, variable): Application-specific message data (no length prefix, continues to end)
 */
export function decodeLayerZeroPacket(packetBytes: Buffer): LzReceiveParams {
  // Check minimum size (Version + Nonce + SrcEID + Sender + DstEID + Receiver + GUID = 113 bytes)
  const MIN_PACKET_SIZE = 1 + 8 + 4 + 32 + 4 + 32 + 32; // 113 bytes
  if (packetBytes.length < MIN_PACKET_SIZE) {
    throw new Error(
      `Packet too short: ${packetBytes.length} bytes (minimum ${MIN_PACKET_SIZE} bytes for PacketV1)`
    );
  }

  let offset = 0;

  // Version (offset 0, 1 byte): 0x01 for PacketV1, 0x00 might be PacketV0 or missing version
  const version = packetBytes[offset];
  if (version === 0x01) {
    // PacketV1 - proceed with standard format
    offset += 1;
  } else if (version === 0x00) {
    // PacketV0 or missing version byte - try parsing as PacketV1 format anyway
    // (some packets might omit the version byte or use 0x00)
    offset += 1;
  } else {
    throw new Error(
      `Invalid packet version: 0x${version.toString(16).padStart(2, '0')} (expected 0x00 or 0x01)`
    );
  }

  // Nonce (offset 1, 8 bytes): Message nonce (uint64, big-endian)
  const nonce = packetBytes.readBigUInt64BE(offset);
  offset += 8;

  // SrcEID (offset 9, 4 bytes): Source endpoint ID (uint32, big-endian)
  const srcEid = packetBytes.readUInt32BE(offset);
  offset += 4;

  // Sender (offset 13, 32 bytes): Sender address as bytes32
  const sender = packetBytes.subarray(offset, offset + 32);
  offset += 32;

  // DstEID (offset 45, 4 bytes): Destination endpoint ID (uint32, big-endian)
  // We don't need this for LzReceiveParams, but we'll read it to advance offset
  const dstEid = packetBytes.readUInt32BE(offset);
  offset += 4;

  // Receiver (offset 49, 32 bytes): Receiver address as bytes32
  // We don't need this for LzReceiveParams, but we'll read it to advance offset
  const receiver = packetBytes.subarray(offset, offset + 32);
  offset += 32;

  // GUID (offset 81, 32 bytes): keccak256(nonce + path)
  const guid = packetBytes.subarray(offset, offset + 32);
  offset += 32;

  // Message (offset 113, variable): Application-specific message data
  // No length prefix - message continues to the end of the packet
  const message = packetBytes.subarray(offset);

  return {
    srcEid,
    sender: Buffer.from(sender),
    nonce,
    guid: Buffer.from(guid),
    message: Buffer.from(message),
    extraData: Buffer.alloc(0), // PacketV1 doesn't have extraData field
  };
}

/**
 * Check if a buffer contains hex-encoded ASCII strings (e.g., "3030" instead of 0x30 0x30)
 * This happens when instruction data is hex-encoded as ASCII in the packet
 * 
 * We check the first portion of the data to see if it looks like hex-encoded ASCII.
 * A strong indicator is if the first 2 bytes decode to a reasonable account count.
 */
function isHexEncodedAscii(data: Buffer): boolean {
  // Must have even length (hex encoding requires 2 chars per byte)
  if (data.length < 4 || data.length % 2 !== 0) {
    return false;
  }
  
  // Check first 20 bytes (10 hex pairs) to see if they're all hex ASCII
  // This is enough to detect the pattern without being too strict
  const checkLength = Math.min(20, data.length);
  let hexAsciiCount = 0;
  for (let i = 0; i < checkLength; i++) {
    const byte = data[i];
    // Valid hex ASCII: 0-9 (0x30-0x39), A-F (0x41-0x46), a-f (0x61-0x66)
    if ((byte >= 0x30 && byte <= 0x39) || (byte >= 0x41 && byte <= 0x46) || (byte >= 0x61 && byte <= 0x66)) {
      hexAsciiCount++;
    }
  }
  
  // If at least 80% of the checked bytes are hex ASCII, it's likely hex-encoded
  if (hexAsciiCount < checkLength * 0.8) {
    return false;
  }
  
  // Additional validation: try decoding the first 4 bytes (2 hex pairs = 1 uint16)
  // and see if it gives a reasonable account count
  try {
    const first4BytesHex = data.subarray(0, 4).toString('ascii');
    const decoded = Buffer.from(first4BytesHex, 'hex');
    if (decoded.length === 2) {
      const accountCount = decoded.readUInt16BE(0);
      // If account count is reasonable (0-100), this is likely hex-encoded
      if (accountCount <= 100) {
        return true;
      }
    }
  } catch {
    // Not valid hex, so not hex-encoded ASCII
    return false;
  }
  
  return true;
}

/**
 * Decode hex-encoded ASCII string to binary buffer
 */
function decodeHexAscii(hexAscii: Buffer): Buffer {
  const hexString = hexAscii.toString('ascii');
  return Buffer.from(hexString, 'hex');
}

/**
 * Extract the governance payload (instruction data) from a LayerZero Packet
 * 
 * This function attempts multiple parsing strategies:
 * 1. First tries to parse as a governance message directly (if bytes are already the message)
 * 2. If that fails, tries to decode as full LayerZero Packet
 * 3. Handles hex-encoded instruction data (when instruction data is hex-encoded as ASCII)
 * 
 * The governance message format is: [ORIGIN_CALLER:32][TARGET:32][instruction_data:*]
 * The LayerZero Packet format wraps this in LzReceiveParams with additional metadata.
 * 
 * This function returns only the instruction_data portion needed for simulation.
 */
export function extractGovernancePayloadFromPacket(packetBytes: Buffer): Buffer {
  // Strategy 1: Try parsing as governance message directly first
  // This is more common - the bytes might already be the governance message
  // Format: [ORIGIN_CALLER:32][TARGET:32][instruction_data:*]
  if (packetBytes.length >= 64) {
    try {
      // Check if this looks like a governance message by verifying we can extract
      // ORIGIN_CALLER and TARGET and have remaining data
      const instructionData = extractInstructionData(packetBytes);
      // Basic validation: instruction data should have at least 2 bytes (for accounts_length)
      if (instructionData.length >= 2) {
        // Check if instruction data is hex-encoded ASCII
        if (isHexEncodedAscii(instructionData)) {
          // Decode from hex ASCII to binary
          const decoded = decodeHexAscii(instructionData);
          // Validate the decoded data
          if (decoded.length >= 2) {
            const accountCount = decoded.readUInt16BE(0);
            const expectedMinLength = 2 + accountCount * 34; // 34 = SERIALIZED_ACCOUNT_LEN
            if (accountCount <= 100 && decoded.length >= expectedMinLength) {
              return decoded;
            }
          }
        } else {
          // Not hex-encoded, try parsing as-is
          const accountCount = instructionData.readUInt16BE(0);
          // Also check if we have enough bytes for the declared accounts
          const expectedMinLength = 2 + accountCount * 34; // 34 = SERIALIZED_ACCOUNT_LEN
          if (accountCount <= 100 && instructionData.length >= expectedMinLength) {
            return instructionData;
          }
        }
        // If account count is unreasonable, this is probably not a governance message
        // Fall through to Strategy 2
      }
    } catch {
      // Not a governance message, continue to try Packet format
    }
  }

  // Strategy 2: Try decoding as full LayerZero Packet
  try {
    const params = decodeLayerZeroPacket(packetBytes);

    // The message field contains the governance message
    // Format: [ORIGIN_CALLER:32][TARGET:32][instruction_data:*]
    // We need to extract the instruction_data portion
    let instructionData = extractInstructionData(params.message);
    
    // Check if instruction data is hex-encoded ASCII (common when bytes come from Ethereum events)
    // Try decoding and validate - if it gives a reasonable account count, use the decoded version
    if (instructionData.length >= 4 && instructionData.length % 2 === 0) {
      try {
        const decoded = decodeHexAscii(instructionData);
        if (decoded.length >= 2) {
          const accountCount = decoded.readUInt16BE(0);
          // If decoded gives a reasonable account count (0-100), use the decoded version
          // This handles cases where instruction data is hex-encoded ASCII
          if (accountCount <= 100) {
            // Additional check: make sure we have enough bytes for the declared accounts
            const expectedMinLength = 2 + accountCount * 34; // 34 = SERIALIZED_ACCOUNT_LEN
            if (decoded.length >= expectedMinLength || decoded.length >= instructionData.length / 2) {
              instructionData = decoded;
            }
          }
        }
      } catch {
        // Decoding failed, use original
      }
    }
    
    return instructionData;
  } catch (packetError) {
    // Strategy 3: Maybe the bytes are already the instruction data (no wrapper)
    // This would happen if someone provides just the instruction payload
    if (packetBytes.length >= 2) {
      try {
        // Check if it's hex-encoded first
        let dataToCheck = packetBytes;
        if (isHexEncodedAscii(packetBytes)) {
          dataToCheck = decodeHexAscii(packetBytes);
        }
        
        const accountCount = dataToCheck.readUInt16BE(0);
        const expectedMinLength = 2 + accountCount * 34; // 34 = SERIALIZED_ACCOUNT_LEN
        if (accountCount > 0 && accountCount <= 100 && dataToCheck.length >= expectedMinLength) {
          // This looks like valid instruction data
          return dataToCheck;
        }
      } catch {
        // Not instruction data either
      }
    }
    
    // All strategies failed
    const packetErrorMsg = packetError instanceof Error ? packetError.message : String(packetError);
    throw new Error(
      `Failed to decode bytes. Tried:\n` +
      `  1. Governance message format ([ORIGIN_CALLER:32][TARGET:32][instruction_data:*])\n` +
      `  2. LayerZero PacketV1 format (Version:1, Nonce:8, SrcEID:4, Sender:32, DstEID:4, Receiver:32, GUID:32, Message:*)\n` +
      `  3. Raw instruction data format\n` +
      `Bytes length: ${packetBytes.length}.\n` +
      `Last error: ${packetErrorMsg}\n` +
      `First 100 bytes (hex): ${packetBytes.subarray(0, Math.min(100, packetBytes.length)).toString('hex')}`
    );
  }
}

/**
 * Decode a LayerZero Packet from a hex string
 */
export function decodeLayerZeroPacketFromHex(hexString: string): LzReceiveParams {
  const packetBytes = hexStringToBytes(hexString);
  return decodeLayerZeroPacket(packetBytes);
}

/**
 * Extract governance payload from a hex-encoded LayerZero Packet
 */
export function extractGovernancePayloadFromHex(hexString: string): Buffer {
  const packetBytes = hexStringToBytes(hexString);
  return extractGovernancePayloadFromPacket(packetBytes);
}
