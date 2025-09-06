import { web3 } from "@coral-xyz/anchor";

const utf8Encode = new TextEncoder();
// "GeneralPurposeGovernance" in bytes
const GENERAL_PURPOSE_GOVERNANCE_BYTES = utf8Encode.encode(
  "GeneralPurposeGovernance"
);
// 0 padded "GeneralPurposeGovernance" in bytes
const WH_GOV_MODULE = new Uint8Array(32);
WH_GOV_MODULE.set(
  GENERAL_PURPOSE_GOVERNANCE_BYTES,
  32 - GENERAL_PURPOSE_GOVERNANCE_BYTES.length
);

enum WHGovernanceAction {
  Undefined,
  EvmCall,
  SolanaCall,
}

enum WHChainId {
  Unset = 0,
  Solana = 1,
  Ethereum = 2,
  Terra = 3,
}

const SOLANA_ACTION_BYTES = new Uint8Array([WHGovernanceAction.SolanaCall]);
const WH_SOLANA_CHAIN_ID = new Uint8Array([0, WHChainId.Solana]);

/**
 * Serialize a number to a byte array of a given length.
 * @param num
 * @param length
 * @returns
 */
const serializeNumberToBytes = (num: number, length: number): Uint8Array => {
  // Validate length
  if (length <= 0 || !Number.isInteger(length)) {
    throw new Error("Length must be a positive integer.");
  }

  // Check if the number is safe for integer operations
  if (!Number.isSafeInteger(num)) {
    throw new Error(
      `Number ${num} is not a safe integer and cannot be reliably serialized.`
    );
  }

  // Check if the number fits in the specified byte length
  const maxPossibleValue = Math.pow(2, length * 8) - 1;
  if (num > maxPossibleValue) {
    throw new Error(
      `Number ${num} is too large for a ${length}-byte Uint8Array.`
    );
  }

  const buffer = new Uint8Array(length);

  // Write most significant byte first (big-endian)
  for (let i = length - 1; i >= 0; i--) {
    buffer[i] = num & 0xff;
    num >>= 8;
  }

  return buffer;
};

/**
 * Serialize the AccountMeta to a valid byte array.
 * @param account
 * @returns
 */
const serializeAccountToBytes = (account: web3.AccountMeta): Uint8Array => {
  const pubkey = account.pubkey.toBytes();
  const isWritable = account.isWritable ? 1 : 0;
  const isSigner = account.isSigner ? 1 : 0;

  const buffer = new Uint8Array(32 + 1 + 1);
  buffer.set(pubkey, 0);
  buffer[32] = isWritable;
  buffer[33] = isSigner;

  return buffer;
};

/**
 * Serialize TransactionInstruction to the following format.
 * |-----------------+----------------------------------+-----------------------------------------|
 * | program_id      |                               32 | Program ID of the program to be invoked |
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data_length     |                                2 | Length of the data                      |
 * | data            |                    `data_length` | Data to be passed to the program        |
 */
const serializeInstruction = (
  instruction: web3.TransactionInstruction
): Uint8Array => {
  const programId = instruction.programId.toBytes();
  const accountsLen = serializeNumberToBytes(instruction.keys.length, 2);
  const accounts = instruction.keys.map(serializeAccountToBytes);
  const dataLen = serializeNumberToBytes(instruction.data.length, 2);
  const totalLen =
    programId.length +
    accountsLen.length +
    34 * instruction.keys.length +
    dataLen.length +
    instruction.data.length;
  const buffer = new Uint8Array(totalLen);

  let offset = 0;
  buffer.set(programId, offset);
  offset += programId.length;
  buffer.set(accountsLen, offset);
  offset += accountsLen.length;
  for (const serializedAccountMeta of accounts) {
    buffer.set(serializedAccountMeta, offset);
    offset += serializedAccountMeta.length;
  }
  buffer.set(dataLen, offset);
  offset += dataLen.length;
  buffer.set(instruction.data, offset);

  return buffer;
};

/**
 * Given a TransactionInstruction, convert it to a WH governance payload for Solana.
 * General purpose governance message to call arbitrary instructions on a governed program.
 *
 * This message adheres to the Wormhole governance packet standard:
 * https://github.com/wormhole-foundation/wormhole/blob/main/whitepapers/0002_governance_messaging.md
 *
 * The wire format for this message is:
 * | field           |                     size (bytes) | description                             |
 * |-----------------+----------------------------------+-----------------------------------------|
 * | MODULE          |                               32 | Governance module identifier            |
 * | ACTION          |                                1 | Governance action identifier            |
 * | CHAIN           |                                2 | Chain identifier                        |
 * | PROGRAM_ID      |                               32 | Governance Program ID                   |
 * |-----------------+----------------------------------+-----------------------------------------|
 * | program_id      |                               32 | Program ID of the program to be invoked |
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data_length     |                                2 | Length of the data                      |
 * | data            |                    `data_length` | Data to be passed to the program        |
 * @param instruction
 * @returns
 */
export const convertInstructionToWhGovernanceSolanaPayload = (
  governanceProgramId: web3.PublicKey,
  instruction: web3.TransactionInstruction
): Uint8Array => {
  const governanceProgramIdBytes = governanceProgramId.toBytes();
  const serializedInstruction = serializeInstruction(instruction);
  const payload = new Uint8Array(
    WH_GOV_MODULE.length +
      SOLANA_ACTION_BYTES.length +
      WH_SOLANA_CHAIN_ID.length +
      governanceProgramIdBytes.length +
      serializedInstruction.length
  );

  let offset = 0;
  payload.set(WH_GOV_MODULE, offset);
  offset += WH_GOV_MODULE.length;
  payload.set(SOLANA_ACTION_BYTES, offset);
  offset += SOLANA_ACTION_BYTES.length;
  payload.set(WH_SOLANA_CHAIN_ID, offset);
  offset += WH_SOLANA_CHAIN_ID.length;
  payload.set(governanceProgramIdBytes, offset);
  offset += governanceProgramIdBytes.length;
  payload.set(serializedInstruction, offset);
  return payload;
};

/** Create "Sentinel" PublicKey to match WH governance placeholder keys */
export const generateSentinelPubkey = (name: string) => {
  const buf = Buffer.alloc(32);
  const nameBytes = utf8Encode.encode(name);
  buf.set(nameBytes);
  return new web3.PublicKey(buf);
};

/** PAYER placeholder key */
export const WH_PAYER_SENTINEL_KEY = generateSentinelPubkey("payer");
/** OWNER placeholder key */
export const WH_OWNER_SENTINEL_KEY = generateSentinelPubkey("owner");
