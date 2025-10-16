// Shared code across LZ and WH governance message codec.

import { web3 } from "@coral-xyz/anchor";

/** Serialized AccountMeta length (32 + 1 + 1) */
export const SERIALIZED_ACCOUNT_LEN = 34;

/**
 * Serialize the AccountMeta to a valid byte array.
 * @param account
 * @returns
 */
export const serializeAccountToBytes = (
  account: web3.AccountMeta
): Uint8Array => {
  const pubkey = account.pubkey.toBytes();
  const isSigner = account.isSigner ? 1 : 0;
  const isWritable = account.isWritable ? 1 : 0;

  const buffer = new Uint8Array(SERIALIZED_ACCOUNT_LEN);
  buffer.set(pubkey, 0);
  buffer[32] = isSigner;
  buffer[33] = isWritable;

  return buffer;
};

/**
 * Deserialize the AccountMeta from byte array.
 * @param payload
 * @returns
 */
export const deserializeAccountFromBytes = (
  payload: Buffer
): web3.AccountMeta => {
  if (payload.length !== SERIALIZED_ACCOUNT_LEN) {
    throw new Error("Invalid serialized Account length");
  }
  const pubkeyBytes = payload.subarray(0, 32);

  return {
    pubkey: new web3.PublicKey(pubkeyBytes),
    isSigner: !!payload[32],
    isWritable: !!payload[33],
  };
};

/** Create "Sentinel" PublicKey to match WH governance placeholder keys */
export const generateSentinelPubkey = (name: string) => {
  if (name.length > 32) {
    throw new Error("Sentinel key name must be 32 bytes or less");
  }
  const buf = Buffer.alloc(32);
  const nameBytes = Buffer.from(name);
  buf.set(nameBytes);
  return new web3.PublicKey(buf);
};
