/**
 * LayerZero account structures and derivation for spoofing
 */

import { web3 } from "@coral-xyz/anchor";
import { LayerZeroConfig } from "./constants";

/**
 * Nonce account data structure
 */
export interface NonceAccount {
  bump: number;
  outboundNonce: bigint;
  inboundNonce: bigint;
}

/**
 * PayloadHash account data structure
 */
export interface PayloadHashAccount {
  hash: Buffer; // 32 bytes
  bump: number;
}

/**
 * OApp Registry account data structure (simplified)
 */
export interface OAppRegistryAccount {
  bump: number;
  delegate: web3.PublicKey | null;
}

/**
 * Container for spoofed account data
 */
export interface SpoofedAccountData {
  oappRegistryAddr: web3.PublicKey;
  nonceAddr: web3.PublicKey;
  payloadHashAddr: web3.PublicKey;
  oappRegistry: OAppRegistryAccount;
  nonceAccount: NonceAccount;
  payloadHashAccount: PayloadHashAccount;
}

/**
 * Generate LayerZero account addresses using PDAs
 */
export function deriveLayerZeroAccounts(
  receiver: web3.PublicKey,
  srcEid: number,
  sender: Uint8Array,
  nonce: bigint
): [web3.PublicKey, web3.PublicKey, web3.PublicKey] {
  // LayerZero accounts are derived using the LayerZero endpoint program, not governance
  
  // OApp Registry PDA
  const [oappRegistry] = web3.PublicKey.findProgramAddressSync(
    [LayerZeroConfig.OAPP_SEED, receiver.toBuffer()],
    LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM
  );
  
  // Nonce PDA
  const srcEidBytes = Buffer.alloc(4);
  srcEidBytes.writeUInt32BE(srcEid, 0);
  const [noncePda] = web3.PublicKey.findProgramAddressSync(
    [
      LayerZeroConfig.NONCE_SEED,
      receiver.toBuffer(),
      srcEidBytes,
      Buffer.from(sender),
    ],
    LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM
  );
  
  // PayloadHash PDA
  const nonceBytes = Buffer.alloc(8);
  nonceBytes.writeBigUInt64BE(nonce, 0);
  const [payloadHashPda] = web3.PublicKey.findProgramAddressSync(
    [
      LayerZeroConfig.PAYLOAD_HASH_SEED,
      receiver.toBuffer(),
      srcEidBytes,
      Buffer.from(sender),
      nonceBytes,
    ],
    LayerZeroConfig.LAYERZERO_ENDPOINT_PROGRAM
  );
  
  return [oappRegistry, noncePda, payloadHashPda];
}

/**
 * Mock spoof the LayerZero endpoint accounts for validation
 */
export function validateLayerZeroAccounts(
  receiver: web3.PublicKey,
  srcEid: number,
  sender: Uint8Array,
  nonce: bigint,
  payloadHash: Buffer
): SpoofedAccountData {
  const [oappRegistryAddr, nonceAddr, payloadHashAddr] = 
    deriveLayerZeroAccounts(receiver, srcEid, sender, nonce);
  
  // Create mock account data structures
  const oappRegistry: OAppRegistryAccount = {
    bump: 255, // Mock bump
    delegate: null,
  };
  
  const nonceAccount: NonceAccount = {
    bump: 255, // Mock bump
    outboundNonce: 0n,
    inboundNonce: nonce - 1n, // Set to allow the target nonce
  };
  
  const payloadHashAccount: PayloadHashAccount = {
    hash: payloadHash,
    bump: 255, // Mock bump
  };
  
  return {
    oappRegistryAddr,
    nonceAddr,
    payloadHashAddr,
    oappRegistry,
    nonceAccount,
    payloadHashAccount,
  };
}

/**
 * Spoof accounts to enable cross-chain governance simulation
 */
export class AccountSpoofer {
  public receiver: web3.PublicKey;
  public srcEid: number;
  public sender: Uint8Array;
  public nonce: bigint;

  constructor(
    receiver: web3.PublicKey,
    srcEid: number,
    sender: Uint8Array,
    nonce: bigint
  ) {
    this.receiver = receiver;
    this.srcEid = srcEid;
    this.sender = sender;
    this.nonce = nonce;
  }
  
  /**
   * Generate all required account data for the simulation
   */
  generateAccountData(payloadHash: Buffer): SpoofedAccountData {
    return validateLayerZeroAccounts(
      this.receiver,
      this.srcEid,
      this.sender,
      this.nonce,
      payloadHash
    );
  }
  
  /**
   * Get derived account addresses
   */
  getAccountAddresses(): [web3.PublicKey, web3.PublicKey, web3.PublicKey] {
    return deriveLayerZeroAccounts(this.receiver, this.srcEid, this.sender, this.nonce);
  }
}

/**
 * Derive remote account PDA
 */
export function deriveRemoteAccount(
  receiver: web3.PublicKey,
  srcEid: number,
  governanceProgram: web3.PublicKey
): web3.PublicKey {
  const srcEidBytes = Buffer.alloc(4);
  srcEidBytes.writeUInt32BE(srcEid, 0);
  const [remoteAccount] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("Remote"),
      receiver.toBuffer(),
      srcEidBytes,
    ],
    governanceProgram
  );
  return remoteAccount;
}

/**
 * Derive CPI authority PDA
 */
export function deriveCpiAuthority(
  receiver: web3.PublicKey,
  srcEid: number,
  originCaller: Uint8Array,
  governanceProgram: web3.PublicKey
): web3.PublicKey {
  const srcEidBytes = Buffer.alloc(4);
  srcEidBytes.writeUInt32BE(srcEid, 0);
  const [cpiAuthority] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("CpiAuthority"),
      receiver.toBuffer(),
      srcEidBytes,
      Buffer.from(originCaller),
    ],
    governanceProgram
  );
  return cpiAuthority;
}

