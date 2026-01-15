import fs from "fs";
import path from "path";
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
import { SURFPOOL_URL } from "./constants";
import { extractGovernancePayloadFromHex } from "./lz-packet-decoder";

export type Network = "devnet" | "mainnet" | "surfpool";
export type Stablecoin = "USDG" | "PYUSD" | "CASH";

export type NetworkConfig<T> = Record<Network, T>;

/**
 * Read and validate the NETWORK env var
 */
export const readNetwork = (): Network => {
  const network = process.env.NETWORK;
  if (network !== "devnet" && network !== "mainnet" && network !== "surfpool") {
    throw new Error("Invalid network argument. Must be devnet, mainnet, or surfpool.");
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
  if (network === "surfpool") {
    return SURFPOOL_URL;
  }

  return "https://api.devnet.solana.com";
};

/**
 * Read config from a TypeScript file
 * The file should export a default export with the config object
 */
export const readConfigFromFile = <T>(configPath: string): T => {
  // Resolve the absolute path - handle both relative and absolute paths
  let absolutePath: string;
  if (path.isAbsolute(configPath) || configPath.startsWith("./") || configPath.startsWith("../")) {
    // Absolute or explicitly relative path - resolve from current working directory
    absolutePath = path.resolve(process.cwd(), configPath);
  } else {
    // Try to resolve as a module
    try {
      absolutePath = require.resolve(configPath, { paths: [process.cwd()] });
    } catch {
      // If that fails, treat as relative path
      absolutePath = path.resolve(process.cwd(), configPath);
    }
  }
  
  // Delete from cache to allow hot reloading during development
  delete require.cache[absolutePath];
  
  // Require the config file (works with ts-node)
  const configModule = require(absolutePath);
  const config = (configModule.default || configModule) as T;
  
  // Validate that config has required fields
  Object.entries(config as Record<string, unknown>).forEach(([key, val]) => {
    if (val === undefined || val === null) {
      throw new Error(`Config is missing ${key}`);
    }
  });
  
  return config;
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
      config: {
        type: "string",
        short: "c",
      },
      surfpool: {
        type: "boolean",
        short: "s",
      },
      "packet-bytes": {
        type: "string",
        short: "b",
      },
      bytes: {
        type: "string",
      },
    },
  }).values;

  // If packet bytes are provided, file is optional
  // Otherwise, file is required
  if (!args["packet-bytes"] && !args.bytes && !args.file) {
    throw new Error("Must include either '--file [FILE_NAME]' or '--packet-bytes [HEX_BYTES]' or '--bytes [HEX_BYTES]'");
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
 * Read payload from file or decode from LayerZero Packet bytes
 * 
 * If packetBytes is provided (via --packet-bytes or --bytes CLI arg),
 * it will decode the full LayerZero Packet and extract the governance payload.
 * Otherwise, it will read the payload from the file (existing behavior).
 * 
 * @param options - Object with optional file path and/or packet bytes
 * @returns The governance payload (instruction data) as Buffer
 */
export const readPayloadOrDecodePacket = (options: {
  file?: string;
  packetBytes?: string;
}): Buffer => {
  // If packet bytes are provided, decode the Packet
  if (options.packetBytes) {
    // Handle file path format (--bytes @/path/to/file)
    if (options.packetBytes.startsWith("@")) {
      const filePath = options.packetBytes.slice(1);
      const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
      return extractGovernancePayloadFromHex(fileContent.trim());
    } else {
      // Direct hex string
      return extractGovernancePayloadFromHex(options.packetBytes);
    }
  }

  // Otherwise, use existing file-based behavior
  if (!options.file) {
    throw new Error("Either file or packetBytes must be provided");
  }

  return readPayloadFile(options.file);
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

  return decoded.replace(/\0+$/, "");
}

/**
 * Convert Ethereum address string to bytes32 format
 */
export function ethereumAddressToBytes32(address: string): Buffer {
  if (!address.startsWith("0x")) {
    throw new Error("Address must start with 0x");
  }
  
  const addressHex = address.slice(2);
  if (addressHex.length !== 40) {
    throw new Error("Invalid Ethereum address length");
  }
  
  const bytes = Buffer.alloc(32);
  // Ethereum addresses are 20 bytes, so we pad with zeros
  const addressBytes = Buffer.from(addressHex, "hex");
  addressBytes.copy(bytes, 12); // Pad with zeros at the beginning
  
  return bytes;
}

/**
 * Convert Solana pubkey to bytes32 format for cross-chain compatibility
 */
export function pubkeyToBytes32(pubkey: web3.PublicKey): Buffer {
  return pubkey.toBuffer();
}

/**
 * Format bytes as hex string for debugging
 */
export function bytesToHexString(bytes: Buffer | Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/**
 * Parse hex string to bytes
 */
export function hexStringToBytes(hexStr: string): Buffer {
  const cleaned = hexStr.trimStart().replace(/^0x/i, "");
  return Buffer.from(cleaned, "hex");
}

/**
 * Get Solana RPC URL from environment variable or fallback to public RPC
 * 
 * Environment variables checked (in order):
 * 1. SOLANA_RPC_URL - Custom RPC URL
 * 2. SOLANA_RPC_ENDPOINT - Alternative env var name
 * 
 * If no environment variable is set, falls back to the public Solana RPC
 */
export function getRpcUrl(): string {
  // Check environment variables in order of preference
  if (process.env.SOLANA_RPC_URL && process.env.SOLANA_RPC_URL.length > 0) {
    console.log(`   🌐 Using RPC from SOLANA_RPC_URL: ${process.env.SOLANA_RPC_URL}`);
    return process.env.SOLANA_RPC_URL;
  }
  
  if (process.env.SOLANA_RPC_ENDPOINT && process.env.SOLANA_RPC_ENDPOINT.length > 0) {
    console.log(`   🌐 Using RPC from SOLANA_RPC_ENDPOINT: ${process.env.SOLANA_RPC_ENDPOINT}`);
    return process.env.SOLANA_RPC_ENDPOINT;
  }
  
  // Fallback to public RPC
  const defaultRpc = "https://api.mainnet-beta.solana.com";
  console.log(`   🌐 Using default public RPC: ${defaultRpc}`);
  return defaultRpc;
}