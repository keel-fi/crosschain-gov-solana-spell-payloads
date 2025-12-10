import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  Instruction,
  isInstructionWithAccounts,
  isSignerRole,
  isWritableRole,
} from "@solana/kit";
import { LiteSVM } from "litesvm";
import { parseArgs } from "util";

export type Network = "devnet" | "mainnet";

export type NetworkConfig<T> = Record<Network, T>;

/**
 * Read and validate the NETWORK env var
 */
export const readNetwork = (): Network => {
  const network = process.env.NETWORK;
  if (network !== "devnet" && network !== "mainnet") {
    throw new Error("Invalid network argument.");
  }
  return network;
};

/**
 * Given the NETWORK, return the configuration.
 */
export const readAndValidateNetworkConfig = <T>(
  configs: NetworkConfig<T>
): { network: Network; config: T } => {
  const network = readNetwork();
  const networkConfig = configs[network];
  Object.entries(configs[network]).forEach(([key, val]) => {
    if (!val) {
      throw new Error(`${network} is missing ${key}`);
    }
  });

  return { network, config: networkConfig };
};

/**
 * RPC endpoint string based on the NETWORK env var.
 * Defaults to devnet.
 */
export const getRpcEndpoint = () => {
  const network = readNetwork();
  if (network === "mainnet") {
    return "https://api.mainnet-beta.solana.com";
  }

  return "https://api.devnet.solana.com";
};

/**
 * Read the payload file argument
 */
export const readArgs = (action: string) => {
  const network = readNetwork();
  const args = parseArgs({
    options: {
      file: {
        type: "string",
        short: "f",
        default: `${action}-${network}.txt`,
      },
    },
  }).values;

  if (!args.file) {
    throw new Error("Must include file prefix '--file [FILE_NAME]'");
  }

  return args;
};

/**
 * Read payload from previously generated hex file.
 */
export const readPayloadFile = (file: string): Buffer => {
  const payloadString = fs.readFileSync(file, {
    encoding: "utf-8",
  });
  return Buffer.from(payloadString, "hex");
};

/**
 * After generating instruction, write to file and pring where the payload
 * was written.
 */
export const writeOutputFile = (file: string, payload: Buffer) => {
  fs.writeFileSync(file, payload.toString("hex"));

  console.log(`Payload generated at ${file}`);
};

/**
 * Handle success response.
 */
export const validateSuccess = (file: string) => {
  const network = readNetwork();

  console.log(`Payload ${file} successfully validated against ${network}`);
};

/**
 * Convert a SimulatedTransactionAccountInfo to AccountInfo
 */
export const convertSimulationToAccountInfo = (
  sim: web3.SimulatedTransactionAccountInfo | null
): web3.AccountInfo<Buffer> => {
  if (!sim) {
    return null;
  }
  return {
    executable: sim.executable,
    owner: new web3.PublicKey(sim.owner),
    lamports: sim.lamports,
    data: Buffer.from(sim.data[0], "base64"),
    rentEpoch: sim.rentEpoch,
  };
};

/**
 * Return a set of de-duplicated keys from a list of instructions.
 * @param instructions
 * @returns
 */
export const getUniquePublicKeysFromInstructionsAndPayer = (
  instructions: web3.TransactionInstruction[],
  payer: web3.PublicKey
): web3.PublicKey[] => {
  const accountPubkeyListNonUnique = instructions
    .map((ix) => ix.keys.map((meta) => meta.pubkey.toString()))
    .flat();
  const accountKeySet = new Set([
    ...accountPubkeyListNonUnique,
    payer.toString(),
  ]);
  return Array.from(accountKeySet, (k, _) => new web3.PublicKey(k));
};

/**
 * Seed a LiteSVM environment with all accounts used within a set
 * of instructions from their state on the supplied connection.
 * @param connection
 * @param instructions
 * @param excludedAddresses
 * @returns
 */
export const createLiteSvmWithInstructionAccounts = async (
  connection: web3.Connection,
  instructions: web3.TransactionInstruction[],
  payer: web3.PublicKey,
  excludedAddresses: string[]
) => {
  // Get all Accounts needed for environment
  const dedupedAddresses = getUniquePublicKeysFromInstructionsAndPayer(
    instructions,
    payer
  );
  const filteredkeys = dedupedAddresses.filter(
    (a) => !excludedAddresses.includes(a.toString())
  );

  // Fetch accounts from the connection
  const allAccounts = await connection.getMultipleAccountsInfo(filteredkeys);

  // Create LiteSVM environment
  const svm = new LiteSVM();
  // Set Accounts from connection in LiteSVM
  allAccounts.forEach((acctInfo, i) => {
    if (!acctInfo) {
      return;
    }
    const pubkey = filteredkeys[i];
    const fixedAcctInfo = {
      ...acctInfo,
      // The RPC sends back a rentEpoch greater than u64::MAX::MAX.
      // So we detect such a number and resolve to an arbitrarily high
      // epoch number.
      rentEpoch:
        acctInfo.rentEpoch === 18_446_744_073_709_552_000
          ? 999_999_999_999_999
          : acctInfo.rentEpoch,
    };
    svm.setAccount(pubkey, fixedAcctInfo);
  });

  return svm;
};

/**
 * Calculate rent-exempt minimum for a Solana account.
 * Approximate formula: base_rent (890,880) + (data_size * 0.000348534 * 2 years)
 * @param dataSize - Size of account data in bytes
 * @returns Rent-exempt minimum in lamports
 */
export const calculateRentExemptMinimum = (dataSize: number): number => {
  const BASE_RENT = 890_880; // Base rent per account per year
  const PER_BYTE_RENT = 0.000348534; // Lamports per byte per year
  const YEARS = 2; // Rent-exempt covers 2 years
  
  // Simplified calculation: base + (data_size * per_byte * years)
  const rent = BASE_RENT + Math.ceil(dataSize * PER_BYTE_RENT * YEARS);
  return rent;
};

/**
 * Create a BPFLoaderUpgradeable buffer account from a program file.
 * Buffer account structure:
 * - 4 bytes: tag (u32 LE) = 1 for Buffer state
 * - 1 byte: authority option (0 = None, 1 = Some)
 * - 32 bytes: authority pubkey (if Some)
 * - remaining: program bytes
 * @param programBytes - The program binary bytes
 * @param authority - The buffer authority (or null if no authority)
 * @param programDataSize - Optional size of the ProgramData account that will be upgraded (to ensure buffer has enough lamports)
 * @returns AccountInfo for the buffer account
 */
export const createBufferAccount = (
  programBytes: Buffer,
  authority: web3.PublicKey | null,
  programDataSize?: number
): web3.AccountInfo<Buffer> => {
  const TAG_LEN = 4;
  const BUFFER_STATE_TAG = 1; // Buffer state enum variant
  
  const tagBuffer = Buffer.allocUnsafe(TAG_LEN);
  tagBuffer.writeUInt32LE(BUFFER_STATE_TAG, 0);
  
  let data: Buffer;
  if (authority) {
    // Option::Some - 1 byte (1) + 32 bytes (pubkey)
    const authorityBuffer = Buffer.concat([
      Buffer.from([1]), // Some variant
      authority.toBuffer(),
    ]);
    data = Buffer.concat([tagBuffer, authorityBuffer, programBytes]);
  } else {
    // Option::None - 1 byte (0)
    data = Buffer.concat([tagBuffer, Buffer.from([0]), programBytes]);
  }
  
  const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new web3.PublicKey(
    "BPFLoaderUpgradeab1e11111111111111111111111"
  );
  
  // Calculate rent-exempt minimum for the buffer account itself
  let lamports = calculateRentExemptMinimum(data.length);
  
  // If ProgramData size is provided, ensure buffer has enough lamports
  // to fund the ProgramData account's rent (the upgrade instruction will
  // transfer lamports from buffer to ProgramData if needed)
  if (programDataSize !== undefined) {
    const programDataRent = calculateRentExemptMinimum(programDataSize);
    // Buffer needs enough to cover ProgramData rent, but ProgramData
    // may already have some lamports, so we add a safety margin
    lamports = Math.max(lamports, programDataRent + 1_000_000);
  } else {
    // Default to a generous amount if ProgramData size unknown
    lamports = Math.max(lamports, 10_000_000); // 0.01 SOL should be plenty
  }
  
  return {
    data,
    executable: false,
    owner: BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
    lamports,
    rentEpoch: 0,
  };
};

/**
 * Resize a ProgramData account to accommodate a larger program.
 * ProgramData structure:
 * - 4 bytes: tag (u32 LE) = 2 for ProgramData state
 * - 8 bytes: slot (u64 LE)
 * - 1 byte: authority option (0 = None, 1 = Some)
 * - 32 bytes: authority pubkey (if Some)
 * - remaining: program code
 * @param programDataAccount - The current ProgramData account
 * @param newProgramSize - The size of the new program code
 * @returns Resized ProgramData account
 */
export const resizeProgramDataAccount = (
  programDataAccount: web3.AccountInfo<Buffer>,
  newProgramSize: number
): web3.AccountInfo<Buffer> => {
  const TAG_LEN = 4;
  const PROGRAMDATA_STATE_TAG = 2; // ProgramData state enum variant
  const HEADER_SIZE = TAG_LEN + 8 + 1 + 32; // tag + slot + authority option + authority pubkey
  
  const requiredSize = HEADER_SIZE + newProgramSize;
  
  // If account is already large enough, return as-is
  if (programDataAccount.data.length >= requiredSize) {
    return programDataAccount;
  }
  
  // Extract the header (first HEADER_SIZE bytes)
  const header = programDataAccount.data.subarray(0, HEADER_SIZE);
  
  // Create new data buffer with required size
  const newData = Buffer.alloc(requiredSize);
  // Copy header
  header.copy(newData, 0);
  // Rest is zero-padded (program code will be written by upgrade instruction)
  
  // Estimate additional lamports needed for the larger account
  // Rough calculation: ~0.00089 SOL per KB
  const sizeIncrease = requiredSize - programDataAccount.data.length;
  const additionalLamports = Math.ceil((sizeIncrease / 1024) * 89_000);
  
  return {
    ...programDataAccount,
    data: newData,
    lamports: programDataAccount.lamports + additionalLamports,
  };
};

/**
 * Convert a @solana/kit instruction to a web3.js instruction.
 * For the conversion the other way, use @solana/compat.
 * @param kitInstruction
 * @returns
 */
export function convertKitInstructionToWeb3Js(
  kitInstruction: Instruction
): web3.TransactionInstruction {
  const keys: web3.AccountMeta[] = [];
  if (isInstructionWithAccounts(kitInstruction)) {
    for (const account of kitInstruction.accounts) {
      keys.push({
        pubkey: new web3.PublicKey(account.address),
        isSigner: isSignerRole(account.role),
        isWritable: isWritableRole(account.role),
      });
    }
  }

  return new web3.TransactionInstruction({
    keys: keys,
    programId: new web3.PublicKey(kitInstruction.programAddress),
    data: Buffer.from(kitInstruction.data || new Uint8Array()),
  });
}
