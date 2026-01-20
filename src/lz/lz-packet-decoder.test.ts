import assert from "assert";
import {
  extractGovernancePayloadFromPacket,
  decodeLayerZeroPacket,
} from "./lz-packet-decoder";
import { SERIALIZED_ACCOUNT_LEN } from "../shared-governance-codec";

/**
 * Static test packet
 */
const STATIC_PACKET_HEX =
  "0100000000000000030000759500000000000000000000000027fc1dd771817b53be48dc28789533bea53c9cca000075d875b81a4430dee7012ff31d58540835ccc89a18d1fc0522bc95df16ecd50efc32410dd975b765e87168ac2a1837452aff2a39e08afb4f95f4909d6c0e8325be5f000000000000000000000000355cd90ecb1b409fdf8b64c4473c3b858da2c3108aadd66fe8f142fb55a08e900228f5488fcc7d73938bbce28e313e1b87da36243030303937303631373936353732303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303130316361643731623330396533303664373961316464353737653263363766326564373133666136356165366434633665383635333462633330336636323831363630303030636163333736346332333135343064643233363466323463373866653866343931633038633432656632656433373066323239303465646139616334383630393030303064333237363832636633393465326538363337653638346136366232646162393237303665363462393439306237653433386638376335636436653238663462303130306563653739643130663033396261313361326434333332643663663561653339653761623436303337383836353635373939643631323165663138306331313230303030383430623035623030626164396665323132656630346533323436636431373966333933316666616233353931356262323738633864366636663862363732643030303035626337303964633731343132666530366535393732313239313537363434323463613065653036353732653239373363646534663738616464626565323339303030313861616464363666653866313432666235356130386539303032323866353438386663633764373339333862626365323865333133653162383764613336323430303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030333031303030303031303130303030303030303030";

const STATIC_PACKET = Buffer.from(STATIC_PACKET_HEX, "hex");

/**
 * Expected values for the static packet
 * These are pre-computed from the packet structure
 */
const EXPECTED_PACKET = {
  version: 0x01,
  nonce: BigInt(3),
  srcEid: 30101, // Ethereum mainnet
  dstEid: 30168, // Solana mainnet
  sender: Buffer.from(
    "00000000000000000000000027fc1dd771817b53be48dc28789533bea53c9cca",
    "hex"
  ),
  receiver: Buffer.from(
    "75b81a4430dee7012ff31d58540835ccc89a18d1fc0522bc95df16ecd50efc32",
    "hex"
  ),
  guid: Buffer.from(
    "410dd975b765e87168ac2a1837452aff2a39e08afb4f95f4909d6c0e8325be5f",
    "hex"
  ),
  messageLength: 702,
};

/**
 * Expected governance message components (extracted from the packet message)
 */
const EXPECTED_GOVERNANCE_MESSAGE = {
  originCaller: Buffer.from(
    "000000000000000000000000355cd90ecb1b409fdf8b64c4473c3b858da2c310",
    "hex"
  ),
  target: Buffer.from(
    "8aadd66fe8f142fb55a08e900228f5488fcc7d73938bbce28e313e1b87da3624",
    "hex"
  ),
};

/**
 * Expected governance payload (decoded from hex-encoded ASCII instruction data)
 * This is what extractGovernancePayloadFromPacket should return
 */
const EXPECTED_GOVERNANCE_PAYLOAD = Buffer.from(
  "000970617965720000000000000000000000000000000000000000000000000000000101cad71b309e306d79a1dd577e2c67f2ed713fa65ae6d4c6e86534bc303f6281660000cac3764c231540dd2364f24c78fe8f491c08c42ef2ed370f22904eda9ac486090000d327682cf394e2e8637e684a66b2dab92706e64b9490b7e438f87c5cd6e28f4b0100ece79d10f039ba13a2d4332d6cf5ae39e7ab46037886565799d6121ef180c1120000840b05b00bad9fe212ef04e3246cd179f3931ffab35915bb278c8d6f6f8b672d00005bc709dc71412fe06e597212915764424ca0ee06572e2973cde4f78addbee23900018aadd66fe8f142fb55a08e900228f5488fcc7d73938bbce28e313e1b87da36240000000000000000000000000000000000000000000000000000000000000000000000000301000001010000000000",
  "hex"
);

/**
 * Expected governance payload properties
 */
const EXPECTED_PAYLOAD_PROPERTIES = {
  length: 319,
  accountCount: 9,
};

describe("lz-packet-decoder", () => {
  describe("extractGovernancePayloadFromPacket", () => {
    describe("Strategy 1: Direct Governance Message Format", () => {
      // Tests for [ORIGIN_CALLER:32][TARGET:32][instruction_data:*]

      it("static packet message tests", () => {
        // Extract the governance message from the static packet for Strategy 1 testing
        const STATIC_GOVERNANCE_MESSAGE = STATIC_PACKET.subarray(113); // Message starts at offset 113

        const result = extractGovernancePayloadFromPacket(
          STATIC_GOVERNANCE_MESSAGE
        );

        assert.deepEqual(result, EXPECTED_GOVERNANCE_PAYLOAD);

        assert.strictEqual(result.length, EXPECTED_PAYLOAD_PROPERTIES.length);

        const accountCount = result.readUInt16BE(0);
        assert.strictEqual(
          accountCount,
          EXPECTED_PAYLOAD_PROPERTIES.accountCount
        );
      });
    });

    describe("Strategy 2: Full LayerZero Packet Format", () => {
      // Tests for PacketV1/V0 format

      it("static packet tests", () => {
        const result = extractGovernancePayloadFromPacket(STATIC_PACKET);

        assert.deepEqual(result, EXPECTED_GOVERNANCE_PAYLOAD);
        assert.strictEqual(result.length, EXPECTED_PAYLOAD_PROPERTIES.length);

        const accountCount = result.readUInt16BE(0);
        assert.strictEqual(
          accountCount,
          EXPECTED_PAYLOAD_PROPERTIES.accountCount
        );

        // Verify it's been decoded (not still hex-encoded ASCII)
        // Hex-encoded ASCII would have length 638, decoded binary has length 319
        assert.strictEqual(result.length, 319);
        assert.notStrictEqual(result.length, 638);
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
          assert.ok(
            errorMessage.includes("Governance message format"),
            "Should mention governance message format"
          );
          assert.ok(
            errorMessage.includes("LayerZero PacketV1 format"),
            "Should mention PacketV1 format"
          );
          assert.ok(
            errorMessage.includes("Raw instruction data format"),
            "Should mention raw instruction data"
          );
          // Check that error message includes bytes info
          assert.ok(
            errorMessage.includes("Bytes length:"),
            "Should include bytes length"
          );
          assert.ok(
            errorMessage.includes("First 100 bytes"),
            "Should include first bytes in hex"
          );
        }
      });
    });
  });

  describe("decodeLayerZeroPacket", () => {
    it("static packet tests", () => {
        const result = decodeLayerZeroPacket(STATIC_PACKET);

        assert.strictEqual(result.srcEid, EXPECTED_PACKET.srcEid);

        assert.strictEqual(result.nonce, EXPECTED_PACKET.nonce);

        assert.deepEqual(result.sender, EXPECTED_PACKET.sender);

        assert.deepEqual(result.guid, EXPECTED_PACKET.guid);

        assert.strictEqual(
          result.message.length,
          EXPECTED_PACKET.messageLength
        );

        assert.deepEqual(result.extraData, Buffer.alloc(0));

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

    describe("packet boundary conditions", () => {
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
    });

    describe("additional invalid version values", () => {
      it("should throw error for version 0xFF", () => {
        const packet = Buffer.alloc(113);
        packet[0] = 0xff;

        assert.throws(
          () => decodeLayerZeroPacket(packet),
          /Invalid packet version: 0xff \(expected 0x00 or 0x01\)/
        );
      });

      it("should throw error for version 0xFE", () => {
        const packet = Buffer.alloc(113);
        packet[0] = 0xfe;

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
        const invalidVersions = [
          0x02, 0x05, 0x0a, 0x20, 0x7f, 0xaa, 0xbb, 0xcc, 0xdd, 0xee,
        ];

        for (const version of invalidVersions) {
          const packet = Buffer.alloc(113);
          packet[0] = version;

          assert.throws(
            () => decodeLayerZeroPacket(packet),
            new RegExp(
              `Invalid packet version: 0x${version.toString(16).padStart(2, "0")}`
            ),
            `Should throw for version 0x${version.toString(16).padStart(2, "0")}`
          );
        }
      });
    });
  });
});
