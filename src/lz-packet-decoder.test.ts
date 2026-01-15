import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  extractGovernancePayloadFromPacket,
  decodeLayerZeroPacket,
} from "./lz-packet-decoder";
import { SERIALIZED_ACCOUNT_LEN } from "./shared-governance-codec";

/**
 * Helper function to create valid instruction data with deterministic pubkeys
 * Format: [accounts_length:2][accounts:accounts_length*34][data:*]
 * Each account is 34 bytes: pubkey (32) + isSigner (1) + isWritable (1)
 * 
 * @param accountCount Number of accounts
 * @param dataLength Length of data portion
 * @param seed Optional seed for deterministic pubkey generation (defaults to accountCount)
 */
function createInstructionData(accountCount: number, dataLength: number, seed?: number): Buffer {
  const totalLen = 2 + accountCount * SERIALIZED_ACCOUNT_LEN + dataLength;
  const buffer = Buffer.alloc(totalLen);
  const baseSeed = seed ?? accountCount * 100;
  
  let offset = 0;
  // accounts_length (2 bytes, big-endian)
  buffer.writeUInt16BE(accountCount, offset);
  offset += 2;
  
  // accounts (accountCount * 34 bytes each) - deterministic
  for (let i = 0; i < accountCount; i++) {
    // Create deterministic pubkey based on seed and index
    const pubkeyBuffer = create32ByteBuffer(baseSeed + i * 10);
    pubkeyBuffer.copy(buffer, offset);
    offset += 32;
    buffer[offset] = i % 2 === 0 ? 1 : 0; // isSigner
    offset += 1;
    buffer[offset] = i % 3 === 0 ? 1 : 0; // isWritable
    offset += 1;
  }
  
  // data (fill with test pattern)
  for (let i = 0; i < dataLength; i++) {
    buffer[offset + i] = (i + 1) % 256;
  }
  
  return buffer;
}

/**
 * Helper function to create a governance message
 * Format: [ORIGIN_CALLER:32][TARGET:32][instruction_data:*]
 */
function createGovernanceMessage(
  originCaller: Buffer,
  target: Buffer,
  instructionData: Buffer
): Buffer {
  if (originCaller.length !== 32) {
    throw new Error("originCaller must be 32 bytes");
  }
  if (target.length !== 32) {
    throw new Error("target must be 32 bytes");
  }
  
  const buffer = Buffer.alloc(64 + instructionData.length);
  originCaller.copy(buffer, 0);
  target.copy(buffer, 32);
  instructionData.copy(buffer, 64);
  
  return buffer;
}

/**
 * Helper function to create a LayerZero Packet
 * Format: Version (1) + Nonce (8) + SrcEID (4) + Sender (32) + DstEID (4) + Receiver (32) + GUID (32) + Message (*)
 */
function createLayerZeroPacket(
  version: number,
  nonce: bigint,
  srcEid: number,
  sender: Buffer,
  dstEid: number,
  receiver: Buffer,
  guid: Buffer,
  message: Buffer
): Buffer {
  const totalLen = 1 + 8 + 4 + 32 + 4 + 32 + 32 + message.length; // 113 + message.length
  const buffer = Buffer.alloc(totalLen);
  
  let offset = 0;
  
  // Version (1 byte)
  buffer[offset] = version;
  offset += 1;
  
  // Nonce (8 bytes, big-endian)
  buffer.writeBigUInt64BE(nonce, offset);
  offset += 8;
  
  // SrcEID (4 bytes, big-endian)
  buffer.writeUInt32BE(srcEid, offset);
  offset += 4;
  
  // Sender (32 bytes)
  sender.copy(buffer, offset);
  offset += 32;
  
  // DstEID (4 bytes, big-endian)
  buffer.writeUInt32BE(dstEid, offset);
  offset += 4;
  
  // Receiver (32 bytes)
  receiver.copy(buffer, offset);
  offset += 32;
  
  // GUID (32 bytes)
  guid.copy(buffer, offset);
  offset += 32;
  
  // Message (variable)
  message.copy(buffer, offset);
  
  return buffer;
}

/**
 * Helper function to create hex-encoded ASCII instruction data
 * Converts binary instruction data to hex ASCII string stored as bytes
 */
function createHexEncodedInstructionData(accountCount: number, dataLength: number, seed?: number): Buffer {
  const binaryData = createInstructionData(accountCount, dataLength, seed);
  const hexString = binaryData.toString("hex");
  return Buffer.from(hexString, "ascii");
}

/**
 * Helper to create a 32-byte buffer (for originCaller, target, sender, receiver, guid)
 */
function create32ByteBuffer(seed: number = 0): Buffer {
  const buffer = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    buffer[i] = (seed + i) % 256;
  }
  return buffer;
}

describe("lz-packet-decoder", () => {
  describe("extractGovernancePayloadFromPacket", () => {
    describe("Strategy 1: Direct Governance Message Format", () => {
      // Tests for [ORIGIN_CALLER:32][TARGET:32][instruction_data:*]
      
      it("should extract instruction data from valid governance message with 1 account", () => {
        const originCaller = create32ByteBuffer(1);
        const target = create32ByteBuffer(2);
        const instructionData = createInstructionData(1, 10);
        const governanceMessage = createGovernanceMessage(originCaller, target, instructionData);
        
        const result = extractGovernancePayloadFromPacket(governanceMessage);
        
        assert.deepEqual(result, instructionData);
      });
      
      it("should extract instruction data from valid governance message with 5 accounts", () => {
        const originCaller = create32ByteBuffer(10);
        const target = create32ByteBuffer(20);
        const instructionData = createInstructionData(5, 20);
        const governanceMessage = createGovernanceMessage(originCaller, target, instructionData);
        
        const result = extractGovernancePayloadFromPacket(governanceMessage);
        
        assert.deepEqual(result, instructionData);
      });
      
      it("should extract instruction data from valid governance message with 100 accounts", () => {
        const originCaller = create32ByteBuffer(100);
        const target = create32ByteBuffer(200);
        const instructionData = createInstructionData(100, 50);
        const governanceMessage = createGovernanceMessage(originCaller, target, instructionData);
        
        const result = extractGovernancePayloadFromPacket(governanceMessage);
        
        assert.deepEqual(result, instructionData);
      });
      
      it("should decode hex-encoded ASCII instruction data in governance message", () => {
        const originCaller = create32ByteBuffer(30);
        const target = create32ByteBuffer(40);
        // Create binary instruction data first
        const binaryInstructionData = createInstructionData(2, 8);
        // Convert to hex-encoded ASCII
        const hexEncodedInstructionData = Buffer.from(binaryInstructionData.toString("hex"), "ascii");
        const governanceMessage = createGovernanceMessage(originCaller, target, hexEncodedInstructionData);
        
        const result = extractGovernancePayloadFromPacket(governanceMessage);
        
        // Result should be the decoded binary data
        assert.deepEqual(result, binaryInstructionData);
      });
      
      it("should handle governance message with empty instruction data portion", () => {
        const originCaller = create32ByteBuffer(50);
        const target = create32ByteBuffer(60);
        // Instruction data with 1 account and 0 bytes of data
        const instructionData = createInstructionData(1, 0);
        const governanceMessage = createGovernanceMessage(originCaller, target, instructionData);
        
        const result = extractGovernancePayloadFromPacket(governanceMessage);
        
        assert.deepEqual(result, instructionData);
      });
    });

    describe("Strategy 2: Full LayerZero Packet Format", () => {
      // Tests for PacketV1/V0 format
      
      it("should extract instruction data from valid PacketV1 with governance message", () => {
        const originCaller = create32ByteBuffer(70);
        const target = create32ByteBuffer(80);
        const instructionData = createInstructionData(3, 15);
        const governanceMessage = createGovernanceMessage(originCaller, target, instructionData);
        
        const packet = createLayerZeroPacket(
          0x01, // version
          BigInt(12345), // nonce
          30101, // srcEid (Ethereum mainnet)
          create32ByteBuffer(90), // sender
          30168, // dstEid (Solana mainnet)
          create32ByteBuffer(100), // receiver
          create32ByteBuffer(110), // guid
          governanceMessage
        );
        
        const result = extractGovernancePayloadFromPacket(packet);
        
        assert.deepEqual(result, instructionData);
      });
      
      it("should extract instruction data from PacketV0 (version 0x00)", () => {
        const originCaller = create32ByteBuffer(120);
        const target = create32ByteBuffer(130);
        const instructionData = createInstructionData(2, 10);
        const governanceMessage = createGovernanceMessage(originCaller, target, instructionData);
        
        const packet = createLayerZeroPacket(
          0x00, // version (PacketV0)
          BigInt(67890), // nonce
          30101, // srcEid
          create32ByteBuffer(140), // sender
          30168, // dstEid
          create32ByteBuffer(150), // receiver
          create32ByteBuffer(160), // guid
          governanceMessage
        );
        
        const result = extractGovernancePayloadFromPacket(packet);
        
        assert.deepEqual(result, instructionData);
      });
      
      it("should decode hex-encoded ASCII instruction data in packet message", () => {
        const originCaller = create32ByteBuffer(170);
        const target = create32ByteBuffer(180);
        // Create binary instruction data
        const binaryInstructionData = createInstructionData(2, 8);
        // Convert to hex-encoded ASCII
        const hexEncodedInstructionData = Buffer.from(binaryInstructionData.toString("hex"), "ascii");
        const governanceMessage = createGovernanceMessage(originCaller, target, hexEncodedInstructionData);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(11111),
          30101,
          create32ByteBuffer(190),
          30168,
          create32ByteBuffer(200),
          create32ByteBuffer(210),
          governanceMessage
        );
        
        const result = extractGovernancePayloadFromPacket(packet);
        
        // Result should be the decoded binary data
        assert.deepEqual(result, binaryInstructionData);
      });
      
      it("should handle packet with large nonce value", () => {
        const originCaller = create32ByteBuffer(220);
        const target = create32ByteBuffer(230);
        const instructionData = createInstructionData(1, 5);
        const governanceMessage = createGovernanceMessage(originCaller, target, instructionData);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt("18446744073709551615"), // max uint64
          30101,
          create32ByteBuffer(240),
          30168,
          create32ByteBuffer(250),
          create32ByteBuffer(5),
          governanceMessage
        );
        
        const result = extractGovernancePayloadFromPacket(packet);
        
        assert.deepEqual(result, instructionData);
      });
    });

    describe("Strategy 3: Raw Instruction Data Format", () => {
      // Tests for raw instruction data
      // Note: Strategy 3 only triggers when Strategies 1 and 2 fail
      // Data must be < 64 bytes to skip Strategy 1 (governance message format)
      // or >= 64 bytes but with invalid "instruction data" at offset 64
      
      it("should extract raw instruction data with 1 account (< 64 bytes)", () => {
        // Create instruction data: 2 + 34 + 10 = 46 bytes (< 64, skips Strategy 1)
        const instructionData = createInstructionData(1, 10, 500);
        
        const result = extractGovernancePayloadFromPacket(instructionData);
        
        assert.deepEqual(result, instructionData);
      });
      
      it("should decode hex-encoded ASCII raw instruction data", () => {
        // Create binary instruction data with deterministic seed
        // 2 + 34 + 5 = 41 bytes
        const binaryInstructionData = createInstructionData(1, 5, 600);
        // Convert to hex-encoded ASCII (82 bytes as ASCII)
        const hexEncodedData = Buffer.from(binaryInstructionData.toString("hex"), "ascii");
        
        const result = extractGovernancePayloadFromPacket(hexEncodedData);
        
        assert.deepEqual(result, binaryInstructionData);
      });
      
      it("should handle raw instruction data that is exactly 63 bytes (max before Strategy 1)", () => {
        // Create instruction data that's exactly 63 bytes (just under Strategy 1 threshold)
        // Need: 2 + N*34 + D = 63, so N=1, D=27 gives 2+34+27=63
        const instructionData = createInstructionData(1, 27, 700);
        
        const result = extractGovernancePayloadFromPacket(instructionData);
        
        assert.deepEqual(result, instructionData);
      });
    });

    describe("Error Cases", () => {
      // Tests for when all strategies fail
      
      it("should throw error for empty buffer", () => {
        const emptyBuffer = Buffer.alloc(0);
        
        assert.throws(
          () => extractGovernancePayloadFromPacket(emptyBuffer),
          /Failed to decode bytes/
        );
      });
      
      it("should throw error for buffer that is too short (< 2 bytes)", () => {
        const shortBuffer = Buffer.from([0x01]);
        
        assert.throws(
          () => extractGovernancePayloadFromPacket(shortBuffer),
          /Failed to decode bytes/
        );
      });
      
      it("should throw error for buffer with unreasonable account count (> 100)", () => {
        // Create a buffer that looks like instruction data with account count > 100
        const buffer = Buffer.alloc(10);
        buffer.writeUInt16BE(150, 0); // account count = 150 (> 100)
        
        assert.throws(
          () => extractGovernancePayloadFromPacket(buffer),
          /Failed to decode bytes/
        );
      });
      
      it("should throw error for buffer with account count = 0 and insufficient data", () => {
        // Create a buffer that looks like instruction data with account count = 0
        // but doesn't pass validation
        const buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(0, 0); // account count = 0
        
        assert.throws(
          () => extractGovernancePayloadFromPacket(buffer),
          /Failed to decode bytes/
        );
      });
      
      it("should throw error for buffer with invalid packet version and invalid instruction data", () => {
        // Create a buffer that fails all strategies:
        // - Strategy 1: bytes 64-65 give account count > 100
        // - Strategy 2: version byte is invalid (0x02)
        // - Strategy 3: bytes 0-1 give account count > 100
        const buffer = Buffer.alloc(113);
        buffer[0] = 0x02; // Invalid version for Strategy 2, also byte 0 of account count for Strategy 3
        buffer[1] = 0x00; // byte 1 of account count = 0x0200 = 512 > 100 for Strategy 3
        // For Strategy 1: bytes at offset 64 and 65 should give account count > 100
        buffer[64] = 0x01; // High byte of account count
        buffer[65] = 0x00; // Low byte = 0x0100 = 256 > 100
        
        assert.throws(
          () => extractGovernancePayloadFromPacket(buffer),
          /Failed to decode bytes/
        );
      });
      
      it("should throw error for garbage data that matches no format", () => {
        // Create random-looking data that won't match any parsing strategy
        const garbageData = Buffer.alloc(50);
        for (let i = 0; i < 50; i++) {
          garbageData[i] = (i * 17 + 123) % 256;
        }
        // Make sure the first 2 bytes don't give a valid account count
        garbageData.writeUInt16BE(200, 0); // 200 > 100, invalid
        
        assert.throws(
          () => extractGovernancePayloadFromPacket(garbageData),
          /Failed to decode bytes/
        );
      });
      
      it("should include helpful debug info in error message", () => {
        const invalidData = Buffer.from([0xff, 0xff, 0xff, 0xff]);
        
        try {
          extractGovernancePayloadFromPacket(invalidData);
          assert.fail("Expected error to be thrown");
        } catch (error) {
          const errorMessage = (error as Error).message;
          // Check that error message includes the strategies attempted
          assert.ok(errorMessage.includes("Governance message format"), "Should mention governance message format");
          assert.ok(errorMessage.includes("LayerZero PacketV1 format"), "Should mention PacketV1 format");
          assert.ok(errorMessage.includes("Raw instruction data format"), "Should mention raw instruction data");
          // Check that error message includes bytes info
          assert.ok(errorMessage.includes("Bytes length:"), "Should include bytes length");
          assert.ok(errorMessage.includes("First 100 bytes"), "Should include first bytes in hex");
        }
      });
      
      it("should throw error for governance message with not enough bytes for declared accounts", () => {
        // Create a governance message where instruction data claims more accounts than available
        const originCaller = create32ByteBuffer(1);
        const target = create32ByteBuffer(2);
        // Create instruction data header that claims 10 accounts but doesn't have enough bytes
        const fakeInstructionData = Buffer.alloc(10);
        fakeInstructionData.writeUInt16BE(10, 0); // claims 10 accounts
        // But only has 8 more bytes, not 10 * 34 = 340 bytes
        
        const governanceMessage = createGovernanceMessage(originCaller, target, fakeInstructionData);
        
        // This should fail because the declared account count doesn't match available bytes
        // The function will fall through all strategies and fail
        assert.throws(
          () => extractGovernancePayloadFromPacket(governanceMessage),
          /Failed to decode bytes/
        );
      });
    });
  });

  describe("decodeLayerZeroPacket", () => {
    it("should decode valid PacketV1 correctly", () => {
      const sender = create32ByteBuffer(1);
      const receiver = create32ByteBuffer(2);
      const guid = create32ByteBuffer(3);
      const message = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
      
      const packet = createLayerZeroPacket(
        0x01,
        BigInt(12345),
        30101,
        sender,
        30168,
        receiver,
        guid,
        message
      );
      
      const result = decodeLayerZeroPacket(packet);
      
      assert.strictEqual(result.srcEid, 30101);
      assert.strictEqual(result.nonce, BigInt(12345));
      assert.deepEqual(result.sender, sender);
      assert.deepEqual(result.guid, guid);
      assert.deepEqual(result.message, message);
      assert.deepEqual(result.extraData, Buffer.alloc(0));
    });
    
    it("should decode PacketV0 (version 0x00) correctly", () => {
      const sender = create32ByteBuffer(10);
      const receiver = create32ByteBuffer(20);
      const guid = create32ByteBuffer(30);
      const message = Buffer.from([0xaa, 0xbb, 0xcc]);
      
      const packet = createLayerZeroPacket(
        0x00,
        BigInt(99999),
        30102,
        sender,
        30169,
        receiver,
        guid,
        message
      );
      
      const result = decodeLayerZeroPacket(packet);
      
      assert.strictEqual(result.srcEid, 30102);
      assert.strictEqual(result.nonce, BigInt(99999));
      assert.deepEqual(result.sender, sender);
      assert.deepEqual(result.guid, guid);
      assert.deepEqual(result.message, message);
    });
    
    it("should throw error for packet that is too short", () => {
      const shortPacket = Buffer.alloc(50); // Less than 113 bytes minimum
      
      assert.throws(
        () => decodeLayerZeroPacket(shortPacket),
        /Packet too short/
      );
    });
    
    it("should throw error for invalid packet version", () => {
      const packet = Buffer.alloc(113);
      packet[0] = 0x02; // Invalid version
      
      assert.throws(
        () => decodeLayerZeroPacket(packet),
        /Invalid packet version/
      );
    });
    
    it("should handle packet with empty message", () => {
      const sender = create32ByteBuffer(40);
      const receiver = create32ByteBuffer(50);
      const guid = create32ByteBuffer(60);
      const message = Buffer.alloc(0); // Empty message
      
      const packet = createLayerZeroPacket(
        0x01,
        BigInt(1),
        30101,
        sender,
        30168,
        receiver,
        guid,
        message
      );
      
      const result = decodeLayerZeroPacket(packet);
      
      assert.deepEqual(result.message, Buffer.alloc(0));
    });
    
    it("should handle large message payload", () => {
      const sender = create32ByteBuffer(70);
      const receiver = create32ByteBuffer(80);
      const guid = create32ByteBuffer(90);
      const message = Buffer.alloc(10000);
      for (let i = 0; i < message.length; i++) {
        message[i] = i % 256;
      }
      
      const packet = createLayerZeroPacket(
        0x01,
        BigInt(555),
        30101,
        sender,
        30168,
        receiver,
        guid,
        message
      );
      
      const result = decodeLayerZeroPacket(packet);
      
      assert.deepEqual(result.message, message);
    });
    
    describe("nonce edge cases", () => {
      it("should handle nonce = 0 (minimum value)", () => {
        const sender = create32ByteBuffer(100);
        const receiver = create32ByteBuffer(101);
        const guid = create32ByteBuffer(102);
        const message = Buffer.from([0x01, 0x02]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(0),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.strictEqual(result.nonce, BigInt(0));
      });
      
      it("should handle nonce = max uint64 (18446744073709551615)", () => {
        const sender = create32ByteBuffer(103);
        const receiver = create32ByteBuffer(104);
        const guid = create32ByteBuffer(105);
        const message = Buffer.from([0x03, 0x04]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt("18446744073709551615"),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.strictEqual(result.nonce, BigInt("18446744073709551615"));
      });
      
      it("should correctly decode various nonce values (big-endian)", () => {
        const sender = create32ByteBuffer(106);
        const receiver = create32ByteBuffer(107);
        const guid = create32ByteBuffer(108);
        const message = Buffer.from([0x05]);
        
        // Test several different nonce values
        const nonceValues = [
          BigInt(1),
          BigInt(255),
          BigInt(256),
          BigInt(65535),
          BigInt(65536),
          BigInt("4294967295"),      // max uint32
          BigInt("4294967296"),      // max uint32 + 1
          BigInt("9007199254740991"), // max safe integer in JS
        ];
        
        for (const nonce of nonceValues) {
          const packet = createLayerZeroPacket(
            0x01,
            nonce,
            30101,
            sender,
            30168,
            receiver,
            guid,
            message
          );
          
          const result = decodeLayerZeroPacket(packet);
          
          assert.strictEqual(result.nonce, nonce, `Failed for nonce ${nonce}`);
        }
      });
    });
    
    describe("endpoint ID edge cases", () => {
      it("should handle srcEid = 0 (minimum value)", () => {
        const sender = create32ByteBuffer(110);
        const receiver = create32ByteBuffer(111);
        const guid = create32ByteBuffer(112);
        const message = Buffer.from([0x01]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          0, // srcEid = 0
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.strictEqual(result.srcEid, 0);
      });
      
      it("should handle srcEid = max uint32 (4294967295)", () => {
        const sender = create32ByteBuffer(113);
        const receiver = create32ByteBuffer(114);
        const guid = create32ByteBuffer(115);
        const message = Buffer.from([0x02]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(2),
          4294967295, // max uint32
          sender,
          4294967295, // dstEid also max
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.strictEqual(result.srcEid, 4294967295);
      });
      
      it("should correctly decode various endpoint ID values (big-endian)", () => {
        const sender = create32ByteBuffer(116);
        const receiver = create32ByteBuffer(117);
        const guid = create32ByteBuffer(118);
        const message = Buffer.from([0x03]);
        
        // Test several different srcEid values including real-world LayerZero endpoint IDs
        const srcEidValues = [
          1,
          255,
          256,
          65535,
          65536,
          30101,      // Ethereum mainnet
          30102,      // BSC mainnet
          30106,      // Avalanche mainnet
          30109,      // Polygon mainnet
          30110,      // Arbitrum mainnet
          30111,      // Optimism mainnet
          30168,      // Solana mainnet
          16777215,   // 0xFFFFFF
          16777216,   // 0x1000000
        ];
        
        for (const srcEid of srcEidValues) {
          const packet = createLayerZeroPacket(
            0x01,
            BigInt(1),
            srcEid,
            sender,
            30168,
            receiver,
            guid,
            message
          );
          
          const result = decodeLayerZeroPacket(packet);
          
          assert.strictEqual(result.srcEid, srcEid, `Failed for srcEid ${srcEid}`);
        }
      });
    });
    
    describe("packet boundary conditions", () => {
      it("should succeed with packet exactly at minimum size (113 bytes, empty message)", () => {
        const sender = create32ByteBuffer(120);
        const receiver = create32ByteBuffer(121);
        const guid = create32ByteBuffer(122);
        const message = Buffer.alloc(0); // Empty message
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        // Verify packet is exactly 113 bytes
        assert.strictEqual(packet.length, 113);
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.strictEqual(result.srcEid, 30101);
        assert.deepEqual(result.message, Buffer.alloc(0));
      });
      
      it("should throw error for packet at 112 bytes (one byte short of minimum)", () => {
        const packet = Buffer.alloc(112);
        packet[0] = 0x01; // Valid version
        
        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Packet too short: 112 bytes \(minimum 113 bytes/
        );
      });
      
      it("should throw error for packet at 1 byte", () => {
        const packet = Buffer.alloc(1);
        packet[0] = 0x01;
        
        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Packet too short: 1 bytes/
        );
      });
      
      it("should handle message size of 1 byte", () => {
        const sender = create32ByteBuffer(123);
        const receiver = create32ByteBuffer(124);
        const guid = create32ByteBuffer(125);
        const message = Buffer.from([0xAB]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        assert.strictEqual(packet.length, 114); // 113 + 1
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.message, message);
      });
      
      it("should handle message size of 2 bytes", () => {
        const sender = create32ByteBuffer(126);
        const receiver = create32ByteBuffer(127);
        const guid = create32ByteBuffer(128);
        const message = Buffer.from([0xAB, 0xCD]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        assert.strictEqual(packet.length, 115); // 113 + 2
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.message, message);
      });
      
      it("should handle message size of 100 bytes", () => {
        const sender = create32ByteBuffer(129);
        const receiver = create32ByteBuffer(130);
        const guid = create32ByteBuffer(131);
        const message = Buffer.alloc(100);
        for (let i = 0; i < 100; i++) {
          message[i] = i;
        }
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        assert.strictEqual(packet.length, 213); // 113 + 100
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.message, message);
      });
      
      it("should handle message size of 1000 bytes", () => {
        const sender = create32ByteBuffer(132);
        const receiver = create32ByteBuffer(133);
        const guid = create32ByteBuffer(134);
        const message = Buffer.alloc(1000);
        for (let i = 0; i < 1000; i++) {
          message[i] = i % 256;
        }
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        assert.strictEqual(packet.length, 1113); // 113 + 1000
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.message, message);
      });
    });
    
    describe("buffer content edge cases", () => {
      it("should handle sender with all zeros", () => {
        const sender = Buffer.alloc(32, 0x00);
        const receiver = create32ByteBuffer(140);
        const guid = create32ByteBuffer(141);
        const message = Buffer.from([0x01]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.sender, sender);
        assert.ok(result.sender.every((b: number) => b === 0x00));
      });
      
      it("should handle sender with all 0xFF bytes", () => {
        const sender = Buffer.alloc(32, 0xFF);
        const receiver = create32ByteBuffer(142);
        const guid = create32ByteBuffer(143);
        const message = Buffer.from([0x02]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.sender, sender);
        assert.ok(result.sender.every((b: number) => b === 0xFF));
      });
      
      it("should handle GUID with all zeros", () => {
        const sender = create32ByteBuffer(144);
        const receiver = create32ByteBuffer(145);
        const guid = Buffer.alloc(32, 0x00);
        const message = Buffer.from([0x03]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.guid, guid);
        assert.ok(result.guid.every((b: number) => b === 0x00));
      });
      
      it("should handle GUID with all 0xFF bytes", () => {
        const sender = create32ByteBuffer(146);
        const receiver = create32ByteBuffer(147);
        const guid = Buffer.alloc(32, 0xFF);
        const message = Buffer.from([0x04]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.guid, guid);
        assert.ok(result.guid.every((b: number) => b === 0xFF));
      });
      
      it("should handle alternating pattern in sender (0xAA, 0x55 repeating)", () => {
        const sender = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
          sender[i] = i % 2 === 0 ? 0xAA : 0x55;
        }
        const receiver = create32ByteBuffer(148);
        const guid = create32ByteBuffer(149);
        const message = Buffer.from([0x05]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.sender, sender);
        // Verify the pattern
        for (let i = 0; i < 32; i++) {
          const expected = i % 2 === 0 ? 0xAA : 0x55;
          assert.strictEqual(result.sender[i], expected, `Byte ${i} mismatch`);
        }
      });
      
      it("should handle message with all zeros", () => {
        const sender = create32ByteBuffer(150);
        const receiver = create32ByteBuffer(151);
        const guid = create32ByteBuffer(152);
        const message = Buffer.alloc(50, 0x00);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.message, message);
        assert.ok(result.message.every((b: number) => b === 0x00));
      });
      
      it("should handle message with all 0xFF bytes", () => {
        const sender = create32ByteBuffer(153);
        const receiver = create32ByteBuffer(154);
        const guid = create32ByteBuffer(155);
        const message = Buffer.alloc(50, 0xFF);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        assert.deepEqual(result.message, message);
        assert.ok(result.message.every((b: number) => b === 0xFF));
      });
    });
    
    describe("buffer immutability (returned buffers are copies)", () => {
      it("should return sender as a copy - mutating result should not affect input", () => {
        const sender = create32ByteBuffer(160);
        const originalSenderCopy = Buffer.from(sender);
        const receiver = create32ByteBuffer(161);
        const guid = create32ByteBuffer(162);
        const message = Buffer.from([0x01, 0x02, 0x03]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        const originalPacketCopy = Buffer.from(packet);
        
        const result = decodeLayerZeroPacket(packet);
        
        // Mutate the result sender
        result.sender[0] = 0xFF;
        result.sender[31] = 0xAA;
        
        // Verify original packet is unchanged
        assert.deepEqual(packet, originalPacketCopy, "Input packet should not be mutated");
        
        // Verify result sender is different from original
        assert.notDeepEqual(result.sender, originalSenderCopy);
      });
      
      it("should return guid as a copy - mutating result should not affect input", () => {
        const sender = create32ByteBuffer(163);
        const receiver = create32ByteBuffer(164);
        const guid = create32ByteBuffer(165);
        const originalGuidCopy = Buffer.from(guid);
        const message = Buffer.from([0x04, 0x05, 0x06]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        const originalPacketCopy = Buffer.from(packet);
        
        const result = decodeLayerZeroPacket(packet);
        
        // Mutate the result guid
        result.guid[0] = 0xFF;
        result.guid[31] = 0xBB;
        
        // Verify original packet is unchanged
        assert.deepEqual(packet, originalPacketCopy, "Input packet should not be mutated");
        
        // Verify result guid is different from original
        assert.notDeepEqual(result.guid, originalGuidCopy);
      });
      
      it("should return message as a copy - mutating result should not affect input", () => {
        const sender = create32ByteBuffer(166);
        const receiver = create32ByteBuffer(167);
        const guid = create32ByteBuffer(168);
        const message = Buffer.from([0x07, 0x08, 0x09, 0x0A, 0x0B]);
        const originalMessageCopy = Buffer.from(message);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        const originalPacketCopy = Buffer.from(packet);
        
        const result = decodeLayerZeroPacket(packet);
        
        // Mutate the result message
        result.message[0] = 0xFF;
        result.message[4] = 0xCC;
        
        // Verify original packet is unchanged
        assert.deepEqual(packet, originalPacketCopy, "Input packet should not be mutated");
        
        // Verify result message is different from original
        assert.notDeepEqual(result.message, originalMessageCopy);
      });
      
      it("should not share references between input and output - mutating input after decode", () => {
        const sender = create32ByteBuffer(169);
        const receiver = create32ByteBuffer(170);
        const guid = create32ByteBuffer(171);
        const message = Buffer.from([0x0C, 0x0D, 0x0E]);
        
        const packet = createLayerZeroPacket(
          0x01,
          BigInt(1),
          30101,
          sender,
          30168,
          receiver,
          guid,
          message
        );
        
        const result = decodeLayerZeroPacket(packet);
        
        // Save copies of the decoded values
        const decodedSenderCopy = Buffer.from(result.sender);
        const decodedGuidCopy = Buffer.from(result.guid);
        const decodedMessageCopy = Buffer.from(result.message);
        
        // Mutate the input packet after decoding
        packet[13] = 0xFF; // Part of sender in packet
        packet[81] = 0xEE; // Part of guid in packet
        packet[113] = 0xDD; // Part of message in packet
        
        // Verify the decoded result is unchanged (was a copy)
        assert.deepEqual(result.sender, decodedSenderCopy, "Decoded sender should be independent copy");
        assert.deepEqual(result.guid, decodedGuidCopy, "Decoded guid should be independent copy");
        assert.deepEqual(result.message, decodedMessageCopy, "Decoded message should be independent copy");
      });
    });
    
    describe("additional invalid version values", () => {
      it("should throw error for version 0xFF", () => {
        const packet = Buffer.alloc(113);
        packet[0] = 0xFF;
        
        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Invalid packet version: 0xff \(expected 0x00 or 0x01\)/
        );
      });
      
      it("should throw error for version 0xFE", () => {
        const packet = Buffer.alloc(113);
        packet[0] = 0xFE;
        
        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Invalid packet version: 0xfe \(expected 0x00 or 0x01\)/
        );
      });
      
      it("should throw error for version 0x03", () => {
        const packet = Buffer.alloc(113);
        packet[0] = 0x03;
        
        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Invalid packet version: 0x03 \(expected 0x00 or 0x01\)/
        );
      });
      
      it("should throw error for version 0x10", () => {
        const packet = Buffer.alloc(113);
        packet[0] = 0x10;
        
        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Invalid packet version: 0x10 \(expected 0x00 or 0x01\)/
        );
      });
      
      it("should throw error for version 0x80", () => {
        const packet = Buffer.alloc(113);
        packet[0] = 0x80;
        
        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Invalid packet version: 0x80 \(expected 0x00 or 0x01\)/
        );
      });
      
      it("should include version byte in error message for multiple invalid values", () => {
        const invalidVersions = [0x02, 0x05, 0x0A, 0x20, 0x7F, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE];
        
        for (const version of invalidVersions) {
          const packet = Buffer.alloc(113);
          packet[0] = version;
          
          assert.throws(
            () => decodeLayerZeroPacket(packet),
            new RegExp(`Invalid packet version: 0x${version.toString(16).padStart(2, '0')}`),
            `Should throw for version 0x${version.toString(16).padStart(2, '0')}`
          );
        }
      });
    });
  });
});
