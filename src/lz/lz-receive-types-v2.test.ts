import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import { parseLzReceiveTypesV2ReturnData } from "./lz-receive-types-v2";

/**
 * Static test buffer for lz_receive_types_v2 return data testing.
 * This represents real return data from an lz_receive_types_v2 call.
 */
const STATIC_TEST_BUFFER = Buffer.from(
  "010000000001000000001600000002010075b81a4430dee7012ff31d58540835ccc89a18d1fc0522bc95df16ecd50efc320000fcebb99d8849b09172b072f589149e43ab5e6a967328178de54257418ab955cf0000d327682cf394e2e8637e684a66b2dab92706e64b9490b7e438f87c5cd6e28f4b00008aadd66fe8f142fb55a08e900228f5488fcc7d73938bbce28e313e1b87da362400005aad76da514b6e1dcf11037e904dac3d375f525c9fbafcb19507b78907d8c18b000075b81a4430dee7012ff31d58540835ccc89a18d1fc0522bc95df16ecd50efc320000bb2079c065e1fae1bfbcca272ecde816303f2c2ad08de7a6f515ac2a95b8b17d00007d99b604a89896c7d3ed6851187a745ece1890cc08511917d2e4f4a5830dfc920000e4e98f657dc7c403b52d3c461ef32109ce35d1737f92ae1d1205fdf6469f00f201001c5eae5faa88478e8729bc45057eb95154f0f7ec4a3ec80503c62b8b7cdd97cc0100d1dd86ac361b6252c406c281f3912ab13b924126c011b587278e8af0b08ef09b00005aad76da514b6e1dcf11037e904dac3d375f525c9fbafcb19507b78907d8c18b00020100cad71b309e306d79a1dd577e2c67f2ed713fa65ae6d4c6e86534bc303f6281660000cac3764c231540dd2364f24c78fe8f491c08c42ef2ed370f22904eda9ac486090000d327682cf394e2e8637e684a66b2dab92706e64b9490b7e438f87c5cd6e28f4b0000ece79d10f039ba13a2d4332d6cf5ae39e7ab46037886565799d6121ef180c1120000840b05b00bad9fe212ef04e3246cd179f3931ffab35915bb278c8d6f6f8b672d00005bc709dc71412fe06e597212915764424ca0ee06572e2973cde4f78addbee23901008aadd66fe8f142fb55a08e900228f5488fcc7d73938bbce28e313e1b87da36240000000000000000000000000000000000000000000000000000000000000000000000",
  "hex"
);

describe("lz-receive-types-v2", () => {
  describe("parseLzReceiveTypesV2ReturnData", () => {
    it("should parse static test buffer correctly", () => {
      const result = parseLzReceiveTypesV2ReturnData(STATIC_TEST_BUFFER);

      // Verify header
      assert.strictEqual(result.contextVersion, 1);
      assert.strictEqual(result.alts.length, 0);
      assert.strictEqual(result.instructions.length, 1);

      // Verify instruction
      const instruction = result.instructions[0];
      assert.strictEqual(instruction.type, "LzReceive");
      assert.strictEqual(instruction.accounts.length, 22);

      // Verify first account is Payer (discriminator 2)
      const firstAccount = instruction.accounts[0];
      assert.strictEqual(firstAccount.addressLocator.type, "Payer");
      assert.strictEqual(firstAccount.isSigner, true); // Payer is always a signer
      assert.strictEqual(firstAccount.isWritable, true);

      // Verify second account is Address type
      const secondAccount = instruction.accounts[1];
      assert.strictEqual(secondAccount.addressLocator.type, "Address");
      if (secondAccount.addressLocator.type === "Address") {
        assert.strictEqual(
          secondAccount.addressLocator.address.toBase58(),
          new web3.PublicKey(
            Buffer.from("75b81a4430dee7012ff31d58540835ccc89a18d1fc0522bc95df16ecd50efc32", "hex")
          ).toBase58()
        );
      }
      assert.strictEqual(secondAccount.isSigner, false);
      assert.strictEqual(secondAccount.isWritable, false);

      // Verify account at index 9 is Address with isWritable=true
      const account9 = instruction.accounts[9];
      assert.strictEqual(account9.addressLocator.type, "Address");
      assert.strictEqual(account9.isWritable, true);

      // Verify account at index 13 is Payer (second Payer in the list)
      const account13 = instruction.accounts[13];
      assert.strictEqual(account13.addressLocator.type, "Payer");
      assert.strictEqual(account13.isSigner, true);
      assert.strictEqual(account13.isWritable, true);

      // Last account should be Address with all zeros (system program or similar)
      const lastAccount = instruction.accounts[21];
      assert.strictEqual(lastAccount.addressLocator.type, "Address");
      if (lastAccount.addressLocator.type === "Address") {
        assert.strictEqual(
          lastAccount.addressLocator.address.toBase58(),
          new web3.PublicKey(Buffer.alloc(32)).toBase58()
        );
      }
    });

    // Error cases
    it("should throw on empty buffer", () => {
      const buffer = Buffer.alloc(0);

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Return data too short for context version/
      );
    });

    it("should throw when ALT count is missing", () => {
      // Only context version (1 byte), missing ALT count
      const buffer = Buffer.alloc(1);
      buffer.writeUInt8(1, 0);

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Return data too short for ALT count/
      );
    });

    it("should throw when ALT data is incomplete", () => {
      // Context version + ALT count says 1 ALT, but no ALT data
      const buffer = Buffer.alloc(5);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(1, 1); // 1 ALT expected

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Return data too short for ALT 0/
      );
    });

    it("should throw when instruction count is missing", () => {
      // Context version + ALT count (0 ALTs), but no instruction count
      const buffer = Buffer.alloc(5);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Return data too short for instruction count/
      );
    });

    it("should throw when instruction type is missing", () => {
      // Context version + ALT count + instruction count (1), but no instruction type
      const buffer = Buffer.alloc(9);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction expected

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Return data too short for instruction 0 type/
      );
    });

    it("should throw on unknown instruction type", () => {
      // Context version + ALT count + instruction count + unknown type
      const buffer = Buffer.alloc(10);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(99, 9); // Unknown instruction type

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Unknown instruction type: 99/
      );
    });

    it("should throw when account count is missing for LzReceive", () => {
      // Context version + ALT count + instruction count + type, but no account count
      const buffer = Buffer.alloc(10);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(0, 9); // LzReceive type

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Return data too short for instruction 0 account count/
      );
    });

    it("should skip accounts when not enough data for discriminator (soft break)", () => {
      // Full header but no account data - implementation breaks early, returns 0 accounts
      const buffer = Buffer.alloc(14);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(0, 9); // LzReceive type
      buffer.writeUInt32LE(1, 10); // 1 account expected but none provided

      // Implementation breaks early instead of throwing, returning 0 accounts
      const result = parseLzReceiveTypesV2ReturnData(buffer);
      assert.strictEqual(result.instructions.length, 1);
      assert.strictEqual(result.instructions[0].accounts.length, 0);
    });

    it("should throw when Address locator pubkey data is incomplete", () => {
      // Has discriminator (2+ bytes to pass early check) but not enough for pubkey
      const buffer = Buffer.alloc(16);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(0, 9); // LzReceive type
      buffer.writeUInt32LE(1, 10); // 1 account
      buffer.writeUInt8(0, 14); // Address discriminator
      buffer.writeUInt8(0, 15); // One more byte to pass the < 2 check

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Not enough data for Address pubkey/
      );
    });

    it("should throw when AltIndex locator data is incomplete", () => {
      // Needs 2 bytes to pass early check, then throw on incomplete AltIndex
      const buffer = Buffer.alloc(16);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(0, 9); // LzReceive type
      buffer.writeUInt32LE(1, 10); // 1 account
      buffer.writeUInt8(1, 14); // AltIndex discriminator
      buffer.writeUInt8(0, 15); // Only 1 byte after discriminator (need 2)

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Not enough data for AltIndex/
      );
    });

    it("should throw when is_writable flag is missing after Signer locator", () => {
      // With exactly 2 bytes remaining:
      // - Read discriminator (1 byte), 1 remaining
      // - Read Signer index (1 byte), 0 remaining
      // - is_writable needs 1 byte, have 0 -> throws
      const buffer = Buffer.alloc(16);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(0, 9); // LzReceive type
      buffer.writeUInt32LE(1, 10); // 1 account
      buffer.writeUInt8(3, 14); // Signer discriminator
      buffer.writeUInt8(0, 15); // Signer index = 0

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Not enough data for is_writable flag/
      );
    });

    it("should throw on unknown AddressLocator discriminator", () => {
      const buffer = Buffer.alloc(16);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(0, 9); // LzReceive type
      buffer.writeUInt32LE(1, 10); // 1 account
      buffer.writeUInt8(99, 14); // Unknown discriminator
      buffer.writeUInt8(1, 15); // isWritable

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Unknown AddressLocator discriminator: 99/
      );
    });

    it("should throw when is_writable flag is missing after AltIndex locator", () => {
      // With exactly 4 bytes remaining after header:
      // - Read discriminator (1 byte), 3 remaining
      // - Read AltIndex (2 bytes), 1 remaining
      // - is_writable needs 1 byte, have 1 -> doesn't throw (need less)
      // So we use 3 bytes to make is_writable fail after AltIndex:
      // - Read discriminator (1 byte), 2 remaining
      // - Read AltIndex (2 bytes), 0 remaining
      // - is_writable needs 1 byte, have 0 -> throws
      const buffer = Buffer.alloc(17);
      buffer.writeUInt8(1, 0); // context version
      buffer.writeUInt32LE(0, 1); // 0 ALTs
      buffer.writeUInt32LE(1, 5); // 1 instruction
      buffer.writeUInt8(0, 9); // LzReceive type
      buffer.writeUInt32LE(1, 10); // 1 account
      buffer.writeUInt8(1, 14); // AltIndex discriminator
      buffer.writeUInt8(0, 15); // altIndex = 0
      buffer.writeUInt8(1, 16); // addressIndex = 1

      assert.throws(
        () => parseLzReceiveTypesV2ReturnData(buffer),
        /Not enough data for is_writable flag/
      );
    });
  });
});
