/**
 * LayerZero account data helper functions
 * 
 * Shared utilities for creating and manipulating LayerZero account data
 * structures used in cross-chain governance simulations.
 */

import { web3 } from "@coral-xyz/anchor";
import { LayerZeroConfig } from "./constants";

/**
 * Create payload hash account data with Anchor discriminator
 */
export function createPayloadHashAccountData(payloadHash: Buffer): Buffer {
  const discriminator = Buffer.from([96, 28, 106, 145, 103, 32, 186, 70]); // Anchor discriminator
  const data = Buffer.alloc(discriminator.length + payloadHash.length + 1);
  discriminator.copy(data, 0);
  payloadHash.copy(data, discriminator.length);
  data[discriminator.length + payloadHash.length] = 255; // bump seed
  return data;
}

/**
 * Adjust nonce account data to allow target nonce
 */
export function adjustNonceAccountData(
  account: web3.AccountInfo<Buffer>,
  targetNonce: bigint
): web3.AccountInfo<Buffer> {
  const data = Buffer.from(account.data);
  if (data.length >= 17) {
    const allowedNonce = targetNonce > 0n ? targetNonce - 1n : 0n;
    const nonceBytes = Buffer.allocUnsafe(8);
    nonceBytes.writeBigUInt64LE(allowedNonce, 0);
    nonceBytes.copy(data, 9);
  }
  return {
    ...account,
    data,
  };
}

/**
 * Create nonce account data
 */
export function createNonceAccountData(targetNonce: bigint): web3.AccountInfo<Buffer> {
  const data = Buffer.alloc(17);
  data[0] = 255; // bump
  const allowedNonce = targetNonce > 0n ? targetNonce - 1n : 0n;
  const nonceBytes = Buffer.allocUnsafe(8);
  nonceBytes.writeBigUInt64LE(0n, 0); // outbound nonce
  nonceBytes.copy(data, 1);
  nonceBytes.writeBigUInt64LE(allowedNonce, 0); // inbound nonce
  nonceBytes.copy(data, 9);
  
  return {
    lamports: 1000000,
    data,
    owner: LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM,
    executable: false,
    rentEpoch: 0,
  };
}

