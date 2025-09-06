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
const WH_GOV_MESSAGE_HEADER_LEN =
  WH_GOV_MODULE.length +
  SOLANA_ACTION_BYTES.length +
  WH_SOLANA_CHAIN_ID.length +
  32; // pubkey length
const SERIALIZED_ACCOUNT_LEN = 34;

/**
 * Serialize the AccountMeta to a valid byte array.
 * @param account
 * @returns
 */
const serializeAccountToBytes = (account: web3.AccountMeta): Uint8Array => {
  const pubkey = account.pubkey.toBytes();
  const isWritable = account.isWritable ? 1 : 0;
  const isSigner = account.isSigner ? 1 : 0;

  const buffer = new Uint8Array(SERIALIZED_ACCOUNT_LEN);
  buffer.set(pubkey, 0);
  buffer[32] = isWritable;
  buffer[33] = isSigner;

  return buffer;
};

/**
 * Deserialize the AccountMeta from byte array.
 * @param payload
 * @returns
 */
const deserializeAccountFromBytes = (payload: Buffer): web3.AccountMeta => {
  const pubkeyBytes = payload.subarray(0, 32);

  return {
    pubkey: new web3.PublicKey(pubkeyBytes),
    isWritable: !!payload[32],
    isSigner: !!payload[33],
  };
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
): Buffer => {
  const programId = instruction.programId.toBytes();
  const accounts = instruction.keys.map(serializeAccountToBytes);
  const totalLen =
    programId.length + // program_id
    2 + // accounts_length
    SERIALIZED_ACCOUNT_LEN * instruction.keys.length + // accounts
    2 + // data_len
    instruction.data.length; // data
  const buffer = Buffer.alloc(totalLen);

  let offset = 0;
  buffer.set(programId, offset);
  offset += programId.length;
  buffer.writeUInt16BE(instruction.keys.length, offset);
  offset += 2;
  for (const serializedAccountMeta of accounts) {
    buffer.set(serializedAccountMeta, offset);
    offset += serializedAccountMeta.length;
  }
  buffer.writeUInt16BE(instruction.data.length, offset);
  offset += 2;
  buffer.set(instruction.data, offset);

  return buffer;
};

/**
 * Deserialize TransactionInstruction from the following format.
 * |-----------------+----------------------------------+-----------------------------------------|
 * | program_id      |                               32 | Program ID of the program to be invoked |
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data_length     |                                2 | Length of the data                      |
 * | data            |                    `data_length` | Data to be passed to the program        |
 */
const deserializeInstruction = (
  payload: Buffer
): web3.TransactionInstruction => {
  let offset = 0;
  const programIdBytes = payload.subarray(offset, offset + 32);
  offset += 32;
  const accountLen = payload.readUInt16BE(offset);
  offset += 2;

  const accounts: web3.AccountMeta[] = [];
  for (let i = 0; i < accountLen; i++) {
    const serializedAccount = payload.subarray(
      offset,
      offset + SERIALIZED_ACCOUNT_LEN
    );
    const account = deserializeAccountFromBytes(serializedAccount);
    accounts.push(account);
    offset += SERIALIZED_ACCOUNT_LEN;
  }

  const dataLen = payload.readUInt16BE(offset);
  offset += 2;
  const data = payload.subarray(offset, offset + dataLen);

  return new web3.TransactionInstruction({
    keys: accounts,
    programId: new web3.PublicKey(programIdBytes),
    data,
  });
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
 */
export const convertInstructionToWhGovernanceSolanaPayload = (
  governanceProgramId: web3.PublicKey,
  instruction: web3.TransactionInstruction
): Buffer => {
  const governanceProgramIdBytes = governanceProgramId.toBytes();
  const serializedInstruction = serializeInstruction(instruction);
  const payload = Buffer.alloc(
    WH_GOV_MESSAGE_HEADER_LEN + serializedInstruction.length
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

/**
 * Deserialize a WH Governance payload by stripping the message header,
 * deserializing the underlying instruction, and replacing the
 * sentinel keys with proper values.
 */
export const convertWhGovernanceSolanaPayloadToInstruction = (
  payload: Buffer,
  payerKey: web3.PublicKey,
  ownerKey: web3.PublicKey
) => {
  // Remove the Gov Message header
  const serializedInstruction = payload.subarray(WH_GOV_MESSAGE_HEADER_LEN);
  // Deserialize instruction
  const instruction = deserializeInstruction(serializedInstruction);
  // Replace sentinel keys with provider values
  instruction.keys = instruction.keys.map((accountMeta) => {
    if (accountMeta.pubkey.equals(WH_PAYER_SENTINEL_KEY)) {
      accountMeta.pubkey = payerKey;
    } else if (accountMeta.pubkey.equals(WH_OWNER_SENTINEL_KEY)) {
      accountMeta.pubkey = ownerKey;
    }
    return accountMeta;
  });

  return instruction;
};
