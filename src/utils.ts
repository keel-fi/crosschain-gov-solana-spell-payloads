import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  Instruction,
  isInstructionWithAccounts,
  isSignerRole,
  isWritableRole,
  ReadonlyUint8Array,
} from "@solana/kit";
import { parseArgs } from "util";
import { LiteSVM } from "litesvm";
import {
  IntegrationConfigArgs,
  getIntegrationConfigEncoder,
} from "@keel-fi/svm-alm-controller";
import createKeccakHash from "keccak";

export type Network = "devnet" | "mainnet";
export type Stablecoin = "USDG" | "PYUSD" | "CASH";

export type NetworkConfig<T> = Record<Network, T>;
export type StablecoinConfig<T> = Record<Stablecoin, T>;
export type NetworkStablecoinConfig<T> = Record<Network, Partial<Record<Stablecoin, T>>>;

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
 * Read and validate the STABLECOIN env var
 */
export const readStablecoin = (): Stablecoin => {
  const stablecoin = process.env.STABLECOIN;
  if (
    stablecoin !== "USDG" &&
    stablecoin !== "PYUSD" &&
    stablecoin !== "CASH"
  ) {
    throw new Error(
      "Invalid stablecoin argument. Must be USDG, PYUSD, or CASH."
    );
  }
  return stablecoin;
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
 * Given the NETWORK and TOKEN, return the configuration.
 */
export const readAndValidateNetworkStablecoinConfig = <T>(
  configs: NetworkStablecoinConfig<T>
): { network: Network; stablecoin: Stablecoin; config: T } => {
  const network = readNetwork();
  const stablecoin = readStablecoin();

  const config = configs[network][stablecoin];
  if (!config) {
    throw new Error(`${network}/${stablecoin} config not found`);
  }

  Object.entries(config as Record<string, unknown>).forEach(([key, val]) => {
    if (val === undefined || val === null) {
      throw new Error(`${network}/${stablecoin} is missing ${key}`);
    }
  });

  return { network, stablecoin, config };
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
  const stablecoin = process.env.STABLECOIN;
  const defaultFile = stablecoin
    ? `${action}-${stablecoin}-${network}.txt`
    : `${action}-${network}.txt`;
  const args = parseArgs({
    options: {
      file: {
        type: "string",
        short: "f",
        default: defaultFile,
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


export function bytesToUtf8TrimNull(bytes: ReadonlyUint8Array): string {
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(
    bytes as Uint8Array
  );

  return decoded.replace(/\0+$/g, "");
}