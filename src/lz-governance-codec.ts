import { web3 } from "@coral-xyz/anchor";
import {
  deserializeAccountFromBytes,
  generateSentinelPubkey,
  serializeAccountToBytes,
  SERIALIZED_ACCOUNT_LEN,
} from "./shared-governance-codec";

const EXECUTOR_ID = new web3.PublicKey(
  "6doghB248px58JSSwG4qejQ46kFMW4AMj7vzJnWZHNZn"
);
const EXECUTION_CONTEXT_SEED = Buffer.from("ExecutionContext");
const EXECUTION_CONTEXT_VERSION_1 = 1;
const EXECUTION_CONTEXT_VERSION_SEED = Buffer.from([
  EXECUTION_CONTEXT_VERSION_1,
]);

// Origin caller address as bytes32
const ORIGIN_CALLER_LEN = 32;
// Target address as bytes32
const TARGET_LEN = 32;

// ORIGIN_CALLER + TARGET
const LZ_GOV_MESSAGE_HEADER_LEN = ORIGIN_CALLER_LEN + TARGET_LEN;

/**
 * Serialize TransactionInstruction to the following format.
 * |-----------------+----------------------------------+-----------------------------------------|
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data            |                        remaining | Data to be passed to the program        |
 */
export const convertInstructionToSolanaGovernancePayload = (
  instruction: web3.TransactionInstruction
): Buffer => {
  const accountsLen = instruction.keys.length;
  const accounts = instruction.keys.map(serializeAccountToBytes);
  const totalLen =
    2 + // accounts_length
    SERIALIZED_ACCOUNT_LEN * accountsLen + // accounts
    instruction.data.length; // data
  const buffer = Buffer.alloc(totalLen);

  let offset = 0;
  buffer.writeUInt16BE(accountsLen, offset);
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
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data            |                        remaining | Data to be passed to the program        |
 */
export const deserializeLzInstruction = (
  targetProgram: web3.PublicKey,
  payload: Buffer
): web3.TransactionInstruction => {
  let offset = 0;
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
    programId: targetProgram,
    data,
  });
};

/**
 * Given a TransactionInstruction, convert it to a LZ governance payload for Solana.
 * General purpose governance message to call arbitrary instructions on a governed program.
 *
 * NOTE: this is not needed for payload generation as the EVM
 * contract will add the governance header (ORIGIN_CALLER, TARGET).
 * `serializeLzInstruction` can be used for the message payload to
 * be hardcoded into the EVM call.
 *
 * The wire format for this message is:
 * | field           |                     size (bytes) | description                             |
 * |-----------------+----------------------------------+-----------------------------------------|
 * | ORIGIN_CALLER   |                               32 | Origin caller address as bytes32        |
 * | TARGET          |                               32 | Target address as bytes32               |
 * |-----------------+----------------------------------+-----------------------------------------|
 * | accounts_length |                                2 | Number of accounts                      |
 * | accounts        | `accounts_length` * (32 + 1 + 1) | Accounts to be passed to the program    |
 * | data            |                        remaining | Data to be passed to the program        |
 *
 */
export const convertInstructionToLzSolanaGovernanceMessage = (
  originCaller: Buffer,
  instruction: web3.TransactionInstruction
): Buffer => {
  const serializedInstruction =
    convertInstructionToSolanaGovernancePayload(instruction);
  const payload = Buffer.alloc(
    LZ_GOV_MESSAGE_HEADER_LEN + serializedInstruction.length
  );

  if (originCaller.length !== ORIGIN_CALLER_LEN) {
    throw new Error("Invalid length of ORIGIN_CALLER");
  }

  const targetProgramBytes = instruction.programId.toBytes();

  let offset = 0;
  payload.set(originCaller, offset);
  offset += ORIGIN_CALLER_LEN;
  payload.set(targetProgramBytes, offset);
  offset += TARGET_LEN;
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
 * Deserialize a LZ Governance payload by adding the target program
 * to the deserialized instruction.
 */
export const convertLzSolanaGovernancePayloadToInstruction = (
  payload: Buffer,
  targetProgram: web3.PublicKey,
  cpiAuthority: web3.PublicKey,
  payerKey: web3.PublicKey
) => {
  // Deserialize instruction
  const instruction = deserializeLzInstruction(targetProgram, payload);

  // Derive the execution context address
  const executionContextAddress = deriveExecutionContextAddress(payerKey);

  // Replace placeholder keys with provider values
  instruction.keys = instruction.keys.map((accountMeta) => {
    if (accountMeta.pubkey.equals(LZ_CPI_AUTHORITY_PLACEHOLDER)) {
      accountMeta.pubkey = cpiAuthority;
    } else if (accountMeta.pubkey.equals(LZ_PAYER_PLACEHOLDER)) {
      accountMeta.pubkey = payerKey;
    } else if (accountMeta.pubkey.equals(LZ_CONTEXT_PLACEHOLDER)) {
      accountMeta.pubkey = executionContextAddress;
    }
    return accountMeta;
  });

  return instruction;
};
