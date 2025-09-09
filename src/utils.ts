/**
 * Convert a bigint value representing a u128 to a 16 byte LE buffer.
 * @param bigint
 * @returns
 */
export const bigintToU128LEBuffer = (bigint: bigint) => {
  const max = 2n ** 128n; // 2^128
  if (bigint < 0n || bigint >= max) {
    throw new Error("Invalid bigint");
  }

  // Initialize a 16-byte buffer
  const buffer = Buffer.alloc(16);

  // Convert BigInt to hex string, remove '0x' prefix, and pad with leading zeros
  let hex = bigint.toString(16).padStart(32, "0"); // 32 hex chars = 16 bytes

  // Reverse the hex string to achieve little-endian order
  hex = hex.match(/.{2}/g).reverse().join("");

  // Write hex string to buffer
  buffer.write(hex, "hex");

  return buffer;
};
