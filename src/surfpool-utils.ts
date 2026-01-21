/**
 * Surfpool RPC utilities for testing with Surfnet
 *
 * This module provides helper functions to interact with Surfpool's
 * custom RPC methods (cheatcodes) for state manipulation.
 */

import { web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";

/**
 * Account info structure for surfnet_setAccount
 */
export interface SurfnetAccountInfo {
  lamports: number;
  data: string;
  owner: string;
  executable: boolean;
  rentEpoch?: number;
}

/**
 * Call a custom Surfpool RPC method
 */
async function callSurfpoolRpc<T>(
  connection: Connection,
  method: string,
  params: unknown[]
): Promise<T> {
  const response = await fetch(connection.rpcEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Surfpool RPC HTTP error (${method}): ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(
      `Surfpool RPC error (${method}): ${JSON.stringify(json.error)}`
    );
  }

  return json.result as T;
}

/**
 * Set an account's state using surfnet_setAccount
 *
 * @param connection - Connection to surfpool RPC
 * @param pubkey - Account public key
 * @param accountInfo - Account info to set
 */
export async function surfnetSetAccount(
  connection: Connection,
  pubkey: web3.PublicKey,
  accountInfo: web3.AccountInfo<Buffer>
): Promise<boolean> {
  // Fix rentEpoch: use 0 for the problematic MAX value that RPC returns
  const rentEpoch =
    accountInfo.rentEpoch === 18_446_744_073_709_552_000
      ? 0
      : (accountInfo.rentEpoch ?? 0);

  const params = [
    pubkey.toBase58(),
    {
      lamports: accountInfo.lamports,
      data: accountInfo.data.toString("hex"),
      owner: accountInfo.owner.toBase58(),
      executable: accountInfo.executable,
      rentEpoch: rentEpoch,
    },
  ];

  return await callSurfpoolRpc<boolean>(
    connection,
    "surfnet_setAccount",
    params
  );
}

/**
 * Reset an account to its mainnet state using surfnet_resetAccount
 *
 * @param connection - Connection to surfpool RPC
 * @param pubkey - Account public key to reset
 */
export async function surfnetResetAccount(
  connection: Connection,
  pubkey: web3.PublicKey
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(connection, "surfnet_resetAccount", [
    pubkey.toBase58(),
  ]);
}

/**
 * Reset the entire network to initial state using surfnet_resetNetwork
 *
 * @param connection - Connection to surfpool RPC
 */
export async function surfnetResetNetwork(
  connection: Connection
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(connection, "surfnet_resetNetwork", []);
}

/**
 * Reset surfnet state using surfnet_resetSurfnet
 *
 * @param connection - Connection to surfpool RPC
 */
export async function surfnetResetSurfnet(
  connection: Connection
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(connection, "surfnet_resetSurfnet", []);
}

/**
 * Set clock using surfnet_setClock
 *
 * @param connection - Connection to surfpool RPC
 * @param slot - Slot number
 * @param unixTimestamp - Unix timestamp
 */
export async function surfnetSetClock(
  connection: Connection,
  slot: number,
  unixTimestamp: number
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(connection, "surfnet_setClock", [
    { slot, unixTimestamp },
  ]);
}

/**
 * Advance clock using surfnet_advanceClock
 *
 * @param connection - Connection to surfpool RPC
 * @param slots - Number of slots to advance
 */
export async function surfnetAdvanceClock(
  connection: Connection,
  slots: number
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(connection, "surfnet_advanceClock", [
    slots,
  ]);
}

/**
 * Write program bytecode using surfnet_writeProgram
 *
 * @param connection - Connection to surfpool RPC
 * @param programId - Program ID to write to
 * @param data - Program bytecode (base64 encoded)
 * @param offset - Offset to write at
 */
export async function surfnetWriteProgram(
  connection: Connection,
  programId: web3.PublicKey,
  data: string,
  offset: number = 0
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(connection, "surfnet_writeProgram", [
    programId.toBase58(),
    data,
    offset,
  ]);
}

/**
 * Set program authority using surfnet_setProgramAuthority
 *
 * @param connection - Connection to surfpool RPC
 * @param programId - Program ID
 * @param authority - New authority public key (or null to remove)
 */
export async function surfnetSetProgramAuthority(
  connection: Connection,
  programId: web3.PublicKey,
  authority: web3.PublicKey | null
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(
    connection,
    "surfnet_setProgramAuthority",
    [programId.toBase58(), authority?.toBase58() ?? null]
  );
}

/**
 * Process a transaction using surfnet_processTransaction
 * This executes the transaction and returns the result
 *
 * @param connection - Connection to surfpool RPC
 * @param transaction - Serialized transaction (base64 encoded)
 */
export async function surfnetProcessTransaction(
  connection: Connection,
  transaction: string
): Promise<{ signature: string; logs: string[] }> {
  return await callSurfpoolRpc<{ signature: string; logs: string[] }>(
    connection,
    "surfnet_processTransaction",
    [transaction]
  );
}

/**
 * Get account data using surfnet_getAccount
 * This returns the raw account data from surfpool's SVM
 *
 * @param connection - Connection to surfpool RPC
 * @param pubkey - Account public key
 */
export async function surfnetGetAccount(
  connection: Connection,
  pubkey: web3.PublicKey
): Promise<web3.AccountInfo<Buffer> | null> {
  const result = await callSurfpoolRpc<SurfnetAccountInfo | null>(
    connection,
    "surfnet_getAccount",
    [pubkey.toBase58()]
  );

  if (!result) {
    return null;
  }

  return {
    lamports: result.lamports,
    data: Buffer.from(result.data, "hex"),
    owner: new web3.PublicKey(result.owner),
    executable: result.executable,
    rentEpoch: result.rentEpoch ?? 0,
  };
}

/**
 * Check if the connection is to a surfpool instance
 * by attempting to call surfnet_getSurfpoolVersion
 */
export async function isSurfpoolConnection(
  connection: Connection
): Promise<boolean> {
  try {
    await callSurfpoolRpc<string>(connection, "surfnet_getSurfpoolVersion", []);
    return true;
  } catch {
    return false;
  }
}
/**
 * Set return data limit using surfnet_setReturnDataLimit
 * This allows programs to return more than the default 1024 bytes
 *
 * @param connection - Connection to surfpool RPC
 * @param limit - Return data limit in bytes
 */
export async function surfnetSetReturnDataLimit(
  connection: Connection,
  limit: number
): Promise<boolean> {
  return await callSurfpoolRpc<boolean>(
    connection,
    "surfnet_setReturnDataLimit",
    [limit]
  );
}

