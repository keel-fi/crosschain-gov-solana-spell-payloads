import { web3 } from "@coral-xyz/anchor";
import {
  deserializeAccountFromBytes,
  generateSentinelPubkey,
  serializeAccountToBytes,
  SERIALIZED_ACCOUNT_LEN,
} from "./shared-governance-codec";

const utf8Encode = new TextEncoder();
const EXECUTOR_ID = new web3.PublicKey(
  "6doghB248px58JSSwG4qejQ46kFMW4AMj7vzJnWZHNZn"
);
const EXECUTION_CONTEXT_SEED = utf8Encode.encode("ExecutionContext");
const EXECUTION_CONTEXT_VERSION_1 = 1;
const EXECUTION_CONTEXT_VERSION_SEED = Buffer.from([
  EXECUTION_CONTEXT_VERSION_1,
]);

enum LZGovernanceAction {
  // Undefined = 0, // unused
  // EvmCall = 1, // unused
  SolanaCall = 2,
}

const ORIGIN_CALLER_LEN = 32;
const SOLANA_ACTION_BYTES = new Uint8Array([LZGovernanceAction.SolanaCall]);

// ACTION + ORIGIN_CALLER
const LZ_GOV_MESSAGE_HEADER_LEN =
  SOLANA_ACTION_BYTES.length + ORIGIN_CALLER_LEN;

/**
 * Serialize TransactionInstruction to the following format.
 * |-----------------+----------------------------------+-----------------------------------------|
 * | program_id      |                               32 | Program ID of the program to be invoked |
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data            |                        remaining | Data to be passed to the program        |
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
  buffer.set(instruction.data, offset);

  return buffer;
};

/**
 * Deserialize TransactionInstruction from the following format.
 * |-----------------+----------------------------------+-----------------------------------------|
 * | program_id      |                               32 | Program ID of the program to be invoked |
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data            |                        remaining | Data to be passed to the program        |
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

  const data = payload.subarray(offset);

  return new web3.TransactionInstruction({
    keys: accounts,
    programId: new web3.PublicKey(programIdBytes),
    data,
  });
};

/**
 * Given a TransactionInstruction, convert it to a LZ governance payload for Solana.
 * General purpose governance message to call arbitrary instructions on a governed program.
 *
 * The wire format for this message is:
 * | field           |                     size (bytes) | description                             |
 * |-----------------+----------------------------------+-----------------------------------------|
 * | ACTION          |                                1 | Governance action identifier            |
 * | ORIGIN_CALLER   |                               32 | Origin caller address as bytes32        |
 * |-----------------+----------------------------------+-----------------------------------------|
 * | program_id      |                               32 | Program ID of the program to be invoked |
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data            |                        remaining | Data to be passed to the program        |
 *
 */
export const convertInstructionToLzGovernanceSolanaPayload = (
  originCaller: Buffer,
  instruction: web3.TransactionInstruction
): Buffer => {
  const serializedInstruction = serializeInstruction(instruction);
  const payload = Buffer.alloc(
    LZ_GOV_MESSAGE_HEADER_LEN + serializedInstruction.length
  );

  if (originCaller.length !== ORIGIN_CALLER_LEN) {
    throw new Error("Invalid length of ORIGIN_CALLER");
  }

  let offset = 0;
  payload.set(SOLANA_ACTION_BYTES, offset);
  offset += SOLANA_ACTION_BYTES.length;
  payload.set(originCaller, offset);
  offset += ORIGIN_CALLER_LEN;
  payload.set(serializedInstruction, offset);
  return payload;
};

/** CPI_AUTHORITY placeholder key */
export const LZ_CPI_AUTHORITY_PLACEHOLDER =
  generateSentinelPubkey("cpi_authority");
/** PAYER placeholder key */
export const LZ_PAYER_PLACEHOLDER = generateSentinelPubkey("payer");
/** CONTEXT placeholder key */
export const LZ_CONTEXT_PLACEHOLDER = generateSentinelPubkey("context");

/**
 * Derive the Execution context address
 * @param payer
 * @returns
 */
export const deriveExecutionContextAddress = (
  payer: web3.PublicKey
): web3.PublicKey => {
  const [executionContextAddress] = web3.PublicKey.findProgramAddressSync(
    [EXECUTION_CONTEXT_SEED, payer.toBytes(), EXECUTION_CONTEXT_VERSION_SEED],
    EXECUTOR_ID
  );
  return executionContextAddress;
};

/**
 * Deserialize a LZ Governance payload by stripping the message header,
 * deserializing the underlying instruction, and replacing the
 * sentinel keys with proper values.
 */
export const convertLzGovernanceSolanaPayloadToInstruction = (
  payload: Buffer,
  cpi_authority: web3.PublicKey,
  payerKey: web3.PublicKey
) => {
  // Remove the Gov Message header
  const serializedInstruction = payload.subarray(LZ_GOV_MESSAGE_HEADER_LEN);
  // Deserialize instruction
  const instruction = deserializeInstruction(serializedInstruction);

  // Derive the execution context address
  const executionContextAddress = deriveExecutionContextAddress(payerKey);

  // Replace placeholder keys with provider values
  instruction.keys = instruction.keys.map((accountMeta) => {
    if (accountMeta.pubkey.equals(LZ_CPI_AUTHORITY_PLACEHOLDER)) {
      accountMeta.pubkey = cpi_authority;
    } else if (accountMeta.pubkey.equals(LZ_PAYER_PLACEHOLDER)) {
      accountMeta.pubkey = payerKey;
    } else if (accountMeta.pubkey.equals(LZ_CONTEXT_PLACEHOLDER)) {
      accountMeta.pubkey = executionContextAddress;
    }
    return accountMeta;
  });

  return instruction;
};
