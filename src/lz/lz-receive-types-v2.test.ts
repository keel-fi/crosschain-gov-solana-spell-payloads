import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import { parseLzReceiveTypesV2ReturnData } from "./lz-receive-types-v2";

/**
 * Helper function to build test buffer for lz_receive_types_v2 return data
 */
function buildTestBuffer(options: {
  contextVersion: number;
  alts?: web3.PublicKey[];
  instructions?: Array<{
    type: number; // 0 = LzReceive
    accounts: Array<{
      locatorType: number; // 0=Address, 1=AltIndex, 2=Payer, 3=Signer, 4=Context
      locatorData?: Buffer; // Additional data for the locator
      isWritable: boolean;
    }>;
  }>;
}): Buffer {
  const parts: Buffer[] = [];

  // Context version (1 byte)
  const contextVersionBuf = Buffer.alloc(1);
  contextVersionBuf.writeUInt8(options.contextVersion, 0);
  parts.push(contextVersionBuf);

  // ALT count (4 bytes LE)
  const alts = options.alts ?? [];
  const altCountBuf = Buffer.alloc(4);
  altCountBuf.writeUInt32LE(alts.length, 0);
  parts.push(altCountBuf);

  // ALT public keys (32 bytes each)
  for (const alt of alts) {
    parts.push(alt.toBuffer());
  }

  // Instruction count (4 bytes LE)
  const instructions = options.instructions ?? [];
  const instructionCountBuf = Buffer.alloc(4);
  instructionCountBuf.writeUInt32LE(instructions.length, 0);
  parts.push(instructionCountBuf);

  // Instructions
  for (const instruction of instructions) {
    // Instruction type (1 byte)
    const typeBuf = Buffer.alloc(1);
    typeBuf.writeUInt8(instruction.type, 0);
    parts.push(typeBuf);

    if (instruction.type === 0) {
      // LzReceive instruction
      // Account count (4 bytes LE)
      const accountCountBuf = Buffer.alloc(4);
      accountCountBuf.writeUInt32LE(instruction.accounts.length, 0);
      parts.push(accountCountBuf);

      // Accounts
      for (const account of instruction.accounts) {
        // AddressLocator discriminator (1 byte)
        const locatorTypeBuf = Buffer.alloc(1);
        locatorTypeBuf.writeUInt8(account.locatorType, 0);
        parts.push(locatorTypeBuf);

        // AddressLocator data (if any)
        if (account.locatorData) {
          parts.push(account.locatorData);
        }

        // is_writable flag (1 byte)
        const isWritableBuf = Buffer.alloc(1);
        isWritableBuf.writeUInt8(account.isWritable ? 1 : 0, 0);
        parts.push(isWritableBuf);
      }
    }
  }

  return Buffer.concat(parts);
}

describe("lz-receive-types-v2", () => {
  describe("parseLzReceiveTypesV2ReturnData", () => {
    it("should parse minimal valid data (0 ALTs, 0 instructions)", () => {
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.contextVersion, 1);
      assert.strictEqual(result.alts.length, 0);
      assert.strictEqual(result.instructions.length, 0);
    });

    it("should parse different context versions", () => {
      const buffer = buildTestBuffer({
        contextVersion: 255,
        alts: [],
        instructions: [],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.contextVersion, 255);
    });

    it("should parse data with single ALT", () => {
      const alt = web3.PublicKey.unique();
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [alt],
        instructions: [],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.contextVersion, 1);
      assert.strictEqual(result.alts.length, 1);
      assert.ok(result.alts[0].equals(alt));
      assert.strictEqual(result.instructions.length, 0);
    });

    it("should parse data with multiple ALTs", () => {
      const alts = [
        web3.PublicKey.unique(),
        web3.PublicKey.unique(),
        web3.PublicKey.unique(),
      ];
      const buffer = buildTestBuffer({
        contextVersion: 2,
        alts,
        instructions: [],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.contextVersion, 2);
      assert.strictEqual(result.alts.length, 3);
      for (let i = 0; i < alts.length; i++) {
        assert.ok(result.alts[i].equals(alts[i]), `ALT ${i} should match`);
      }
      assert.strictEqual(result.instructions.length, 0);
    });

    it("should parse data with LzReceive instruction with Address locator", () => {
      const accountPubkey = web3.PublicKey.unique();
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0, // LzReceive
            accounts: [
              {
                locatorType: 0, // Address
                locatorData: accountPubkey.toBuffer(),
                isWritable: true,
              },
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.contextVersion, 1);
      assert.strictEqual(result.alts.length, 0);
      assert.strictEqual(result.instructions.length, 1);

      const instruction = result.instructions[0];
      assert.strictEqual(instruction.type, "LzReceive");
      assert.strictEqual(instruction.accounts.length, 1);

      const account = instruction.accounts[0];
      assert.strictEqual(account.addressLocator.type, "Address");
      if (account.addressLocator.type === "Address") {
        assert.ok(account.addressLocator.address.equals(accountPubkey));
      }
      assert.strictEqual(account.isWritable, true);
      assert.strictEqual(account.isSigner, false); // Address type is not a signer
    });

    it("should parse data with LzReceive instruction with multiple accounts", () => {
      const pubkey1 = web3.PublicKey.unique();
      const pubkey2 = web3.PublicKey.unique();
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0, // LzReceive
            accounts: [
              {
                locatorType: 0, // Address
                locatorData: pubkey1.toBuffer(),
                isWritable: true,
              },
              {
                locatorType: 0, // Address
                locatorData: pubkey2.toBuffer(),
                isWritable: false,
              },
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.instructions.length, 1);
      const instruction = result.instructions[0];
      assert.strictEqual(instruction.accounts.length, 2);

      assert.strictEqual(instruction.accounts[0].isWritable, true);
      assert.strictEqual(instruction.accounts[1].isWritable, false);
    });

    it("should parse AltIndex address locator (discriminator 1)", () => {
      // AltIndex(altIndex: u8, addressIndex: u8)
      const altIndexData = Buffer.alloc(2);
      altIndexData.writeUInt8(0, 0); // altIndex = 0
      altIndexData.writeUInt8(5, 1); // addressIndex = 5

      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [
              {
                locatorType: 1, // AltIndex
                locatorData: altIndexData,
                isWritable: true,
              },
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);
      const account = result.instructions[0].accounts[0];

      assert.strictEqual(account.addressLocator.type, "AltIndex");
      if (account.addressLocator.type === "AltIndex") {
        assert.strictEqual(account.addressLocator.altIndex, 0);
        assert.strictEqual(account.addressLocator.addressIndex, 5);
      }
      assert.strictEqual(account.isSigner, false); // AltIndex is not a signer
    });

    it("should parse Payer address locator (discriminator 2)", () => {
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [
              {
                locatorType: 2, // Payer
                locatorData: undefined, // No additional data
                isWritable: true,
              },
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);
      const account = result.instructions[0].accounts[0];

      assert.strictEqual(account.addressLocator.type, "Payer");
      assert.strictEqual(account.isSigner, true); // Payer is always a signer
      assert.strictEqual(account.isWritable, true);
    });

    it("should parse Signer address locator (discriminator 3)", () => {
      // Signer(index: u8)
      const signerData = Buffer.alloc(1);
      signerData.writeUInt8(2, 0); // signerIndex = 2

      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [
              {
                locatorType: 3, // Signer
                locatorData: signerData,
                isWritable: false,
              },
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);
      const account = result.instructions[0].accounts[0];

      assert.strictEqual(account.addressLocator.type, "Signer");
      if (account.addressLocator.type === "Signer") {
        assert.strictEqual(account.addressLocator.index, 2);
      }
      assert.strictEqual(account.isSigner, true); // Signer type is always a signer
      assert.strictEqual(account.isWritable, false);
    });

    it("should parse Context address locator (discriminator 4)", () => {
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [
              {
                locatorType: 4, // Context
                locatorData: undefined, // No additional data
                isWritable: true,
              },
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);
      const account = result.instructions[0].accounts[0];

      assert.strictEqual(account.addressLocator.type, "Context");
      assert.strictEqual(account.isSigner, false); // Context is not a signer
      assert.strictEqual(account.isWritable, true);
    });

    it("should parse all AddressLocator types in a single instruction", () => {
      const addressPubkey = web3.PublicKey.unique();
      const altIndexData = Buffer.alloc(2);
      altIndexData.writeUInt8(1, 0);
      altIndexData.writeUInt8(3, 1);
      const signerData = Buffer.alloc(1);
      signerData.writeUInt8(0, 0);

      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [
              { locatorType: 0, locatorData: addressPubkey.toBuffer(), isWritable: true },  // Address
              { locatorType: 1, locatorData: altIndexData, isWritable: false },              // AltIndex
              { locatorType: 2, locatorData: undefined, isWritable: true },                  // Payer
              { locatorType: 3, locatorData: signerData, isWritable: false },                // Signer
              { locatorType: 4, locatorData: undefined, isWritable: true },                  // Context
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);
      const accounts = result.instructions[0].accounts;

      assert.strictEqual(accounts.length, 5);
      assert.strictEqual(accounts[0].addressLocator.type, "Address");
      assert.strictEqual(accounts[1].addressLocator.type, "AltIndex");
      assert.strictEqual(accounts[2].addressLocator.type, "Payer");
      assert.strictEqual(accounts[3].addressLocator.type, "Signer");
      assert.strictEqual(accounts[4].addressLocator.type, "Context");

      // Verify signer status based on locator type
      assert.strictEqual(accounts[0].isSigner, false); // Address
      assert.strictEqual(accounts[1].isSigner, false); // AltIndex
      assert.strictEqual(accounts[2].isSigner, true);  // Payer
      assert.strictEqual(accounts[3].isSigner, true);  // Signer
      assert.strictEqual(accounts[4].isSigner, false); // Context
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

    // Edge cases
    it("should parse data with many ALTs (10)", () => {
      const alts = Array.from({ length: 10 }, () => web3.PublicKey.unique());
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts,
        instructions: [],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.alts.length, 10);
      for (let i = 0; i < 10; i++) {
        assert.ok(result.alts[i].equals(alts[i]), `ALT ${i} should match`);
      }
    });

    it("should parse data with multiple instructions", () => {
      const pubkey1 = web3.PublicKey.unique();
      const pubkey2 = web3.PublicKey.unique();
      const pubkey3 = web3.PublicKey.unique();

      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [{ locatorType: 0, locatorData: pubkey1.toBuffer(), isWritable: true }],
          },
          {
            type: 0,
            accounts: [{ locatorType: 0, locatorData: pubkey2.toBuffer(), isWritable: false }],
          },
          {
            type: 0,
            accounts: [{ locatorType: 0, locatorData: pubkey3.toBuffer(), isWritable: true }],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.instructions.length, 3);
      assert.strictEqual(result.instructions[0].type, "LzReceive");
      assert.strictEqual(result.instructions[1].type, "LzReceive");
      assert.strictEqual(result.instructions[2].type, "LzReceive");

      // Verify accounts
      if (result.instructions[0].accounts[0].addressLocator.type === "Address") {
        assert.ok(result.instructions[0].accounts[0].addressLocator.address.equals(pubkey1));
      }
      if (result.instructions[1].accounts[0].addressLocator.type === "Address") {
        assert.ok(result.instructions[1].accounts[0].addressLocator.address.equals(pubkey2));
      }
      if (result.instructions[2].accounts[0].addressLocator.type === "Address") {
        assert.ok(result.instructions[2].accounts[0].addressLocator.address.equals(pubkey3));
      }
    });

    it("should parse complex scenario with ALTs, multiple instructions, and mixed accounts", () => {
      const alts = [web3.PublicKey.unique(), web3.PublicKey.unique()];
      const addressPubkey1 = web3.PublicKey.unique();
      const addressPubkey2 = web3.PublicKey.unique();

      const altIndexData1 = Buffer.alloc(2);
      altIndexData1.writeUInt8(0, 0);
      altIndexData1.writeUInt8(1, 1);

      const altIndexData2 = Buffer.alloc(2);
      altIndexData2.writeUInt8(1, 0);
      altIndexData2.writeUInt8(0, 1);

      const signerData = Buffer.alloc(1);
      signerData.writeUInt8(0, 0);

      const buffer = buildTestBuffer({
        contextVersion: 3,
        alts,
        instructions: [
          {
            type: 0,
            accounts: [
              { locatorType: 0, locatorData: addressPubkey1.toBuffer(), isWritable: true },
              { locatorType: 1, locatorData: altIndexData1, isWritable: false },
              { locatorType: 2, locatorData: undefined, isWritable: true },
            ],
          },
          {
            type: 0,
            accounts: [
              { locatorType: 0, locatorData: addressPubkey2.toBuffer(), isWritable: false },
              { locatorType: 1, locatorData: altIndexData2, isWritable: true },
              { locatorType: 3, locatorData: signerData, isWritable: false },
              { locatorType: 4, locatorData: undefined, isWritable: true },
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      // Verify structure
      assert.strictEqual(result.contextVersion, 3);
      assert.strictEqual(result.alts.length, 2);
      assert.strictEqual(result.instructions.length, 2);

      // Verify first instruction
      const inst1 = result.instructions[0];
      assert.strictEqual(inst1.accounts.length, 3);
      assert.strictEqual(inst1.accounts[0].addressLocator.type, "Address");
      assert.strictEqual(inst1.accounts[1].addressLocator.type, "AltIndex");
      assert.strictEqual(inst1.accounts[2].addressLocator.type, "Payer");

      // Verify second instruction
      const inst2 = result.instructions[1];
      assert.strictEqual(inst2.accounts.length, 4);
      assert.strictEqual(inst2.accounts[0].addressLocator.type, "Address");
      assert.strictEqual(inst2.accounts[1].addressLocator.type, "AltIndex");
      assert.strictEqual(inst2.accounts[2].addressLocator.type, "Signer");
      assert.strictEqual(inst2.accounts[3].addressLocator.type, "Context");

      // Verify AltIndex values
      if (inst1.accounts[1].addressLocator.type === "AltIndex") {
        assert.strictEqual(inst1.accounts[1].addressLocator.altIndex, 0);
        assert.strictEqual(inst1.accounts[1].addressLocator.addressIndex, 1);
      }
      if (inst2.accounts[1].addressLocator.type === "AltIndex") {
        assert.strictEqual(inst2.accounts[1].addressLocator.altIndex, 1);
        assert.strictEqual(inst2.accounts[1].addressLocator.addressIndex, 0);
      }
    });

    it("should correctly parse writable flags for all accounts", () => {
      const pubkey = web3.PublicKey.unique();

      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [
              { locatorType: 0, locatorData: pubkey.toBuffer(), isWritable: false },
              { locatorType: 2, locatorData: undefined, isWritable: false }, // Payer, not writable
              { locatorType: 4, locatorData: undefined, isWritable: true },  // Context, writable
            ],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);
      const accounts = result.instructions[0].accounts;

      assert.strictEqual(accounts[0].isWritable, false);
      assert.strictEqual(accounts[1].isWritable, false);
      assert.strictEqual(accounts[2].isWritable, true);
    });

    it("should handle instruction with zero accounts", () => {
      const buffer = buildTestBuffer({
        contextVersion: 1,
        alts: [],
        instructions: [
          {
            type: 0,
            accounts: [],
          },
        ],
      });

      const result = parseLzReceiveTypesV2ReturnData(buffer);

      assert.strictEqual(result.instructions.length, 1);
      assert.strictEqual(result.instructions[0].accounts.length, 0);
    });
  });
});
