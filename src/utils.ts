import fs from "fs";
import path from "path";
import { web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import {
  Instruction,
  isInstructionWithAccounts,
  isSignerRole,
  isWritableRole,
  ReadonlyUint8Array,
} from "@solana/kit";
import { parseArgs } from "util";
import { SURFPOOL_URL } from "./constants";
import { extractGovernancePayloadFromHex } from "./lz/lz-packet-decoder";
import { surfnetSetAccount } from "./surfpool-utils";

export type Stablecoin = "USDG" | "PYUSD" | "CASH";

/**
 * Validate a config object has all required fields.
 */
export const validateConfig = <T>(config: T): T => {
  Object.entries(config as object).forEach(([key, val]) => {
    if (val === undefined || val === null) {
      throw new Error(`Config is missing ${key}`);
    }
  });

  return config;
};

/**
 * RPC endpoint string for Surfpool.
 */
export const getRpcEndpoint = () => {
  return SURFPOOL_URL;
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
  const stablecoin = process.env.STABLECOIN;
  const defaultFile = stablecoin
    ? `${action}-${stablecoin}.txt`
    : `${action}.txt`;
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
  console.log(`Payload ${file} successfully validated against surfpool`);
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
 * Create a Surfpool connection and set up custom account state for accounts
 * that need to be overridden (e.g., for simulation purposes).
 * 
 * Surfpool automatically fetches mainnet accounts on demand (JIT),
 * so this function only needs to set custom accounts that differ from mainnet.
 * 
 * @param connection - Connection to Surfpool RPC
 * @param customAccounts - Map of pubkey -> account info for accounts to override
 * @returns The same connection (for chaining)
 */
export const setupSurfpoolWithCustomAccounts = async (
  connection: Connection,
  customAccounts: Map<web3.PublicKey, web3.AccountInfo<Buffer>>
): Promise<Connection> => {
  // Set custom accounts using surfnet_setAccount
  for (const [pubkey, accountInfo] of customAccounts) {
    await surfnetSetAccount(connection, pubkey, accountInfo);
  }
  
  return connection;
};

/**
 * Create a Connection to Surfpool RPC for simulation
 * 
 * Surfpool automatically fetches mainnet accounts on demand (JIT),
 * so no manual account loading is needed.
 * 
 * @returns Connection configured for Surfpool
 */
export const createSurfpoolConnection = (): Connection => {
  return new Connection(SURFPOOL_URL, "confirmed");
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
 * Get Solana RPC URL from environment variable or fallback to Surfpool
 * 
 * Environment variables checked (in order):
 * 1. SOLANA_RPC_URL - Custom RPC URL
 * 2. SOLANA_RPC_ENDPOINT - Alternative env var name
 * 
 * If no environment variable is set, falls back to Surfpool URL
 */
export function getRpcUrl(): string {
  // Check environment variables in order of preference
  if (process.env.SOLANA_RPC_URL && process.env.SOLANA_RPC_URL.length > 0) {
    return process.env.SOLANA_RPC_URL;
  }
  
  if (process.env.SOLANA_RPC_ENDPOINT && process.env.SOLANA_RPC_ENDPOINT.length > 0) {
    return process.env.SOLANA_RPC_ENDPOINT;
  }
  
  // Fallback to Surfpool
  return SURFPOOL_URL;
}
