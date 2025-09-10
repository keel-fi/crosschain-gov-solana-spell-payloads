// copy/pasta from Keel's solana-psm repository
import { web3 } from "@coral-xyz/anchor";
import { blob, struct, u8 } from "@solana/buffer-layout";
import { publicKey, u128, u64 } from "@solana/buffer-layout-utils";

// TODO update to the mainnet program ID when deployed
export const SOLANA_PSM_PROGRAM_ID = new web3.PublicKey(
  "PSMi4nPG9aB2cKksv5LoxVS1RufH1bew59vr6bxdDYH"
);

export interface RawTokenSwap {
  version: number;
  isInitialized: boolean;
  bumpSeed: number;
  poolTokenProgramId: web3.PublicKey;
  tokenAccountA: web3.PublicKey;
  tokenAccountB: web3.PublicKey;
  tokenPool: web3.PublicKey;
  mintA: web3.PublicKey;
  mintB: web3.PublicKey;
  feeAccount: web3.PublicKey;
  tradeFeeNumerator: bigint;
  tradeFeeDenominator: bigint;
  ownerTradeFeeNumerator: bigint;
  ownerTradeFeeDenominator: bigint;
  ownerWithdrawFeeNumerator: bigint;
  ownerWithdrawFeeDenominator: bigint;
  hostFeeNumerator: bigint;
  hostFeeDenominator: bigint;
  curveType: number;
  curveParameters: Uint8Array;
}

export const TokenSwapLayout = struct<RawTokenSwap>([
  u8("version"),
  u8("isInitialized"),
  u8("bumpSeed"),
  publicKey("poolTokenProgramId"),
  publicKey("tokenAccountA"),
  publicKey("tokenAccountB"),
  publicKey("tokenPool"),
  publicKey("mintA"),
  publicKey("mintB"),
  publicKey("feeAccount"),
  u64("tradeFeeNumerator"),
  u64("tradeFeeDenominator"),
  u64("ownerTradeFeeNumerator"),
  u64("ownerTradeFeeDenominator"),
  u64("ownerWithdrawFeeNumerator"),
  u64("ownerWithdrawFeeDenominator"),
  u64("hostFeeNumerator"),
  u64("hostFeeDenominator"),
  u8("curveType"),
  blob(64, "curveParameters"),
]);

export interface RawRedemptionRateCurve {
  maxSsr: bigint;
  ssr: bigint;
  rho: bigint;
  chi: bigint;
}

export interface SetRatesInstruction {
  instruction: number;
  ssr: bigint;
  rho: bigint;
  chi: bigint;
}

/** Struct for (de)serialization of RedemptionRateCurve */
export const RedemptionRateCurveLayout = struct<RawRedemptionRateCurve>([
  u128("maxSsr"),
  u128("ssr"),
  u128("rho"),
  u128("chi"),
]);

const SetRatesInstructionLayout = struct<SetRatesInstruction>([
  u8("instruction"),
  u128("ssr"),
  u128("rho"),
  u128("chi"),
]);

/**
 * Construct a SetRates instruction for the Solana PSM.
 * @param swapAccount
 * @param permissionAccount
 * @param authority
 * @param ssr
 * @param rho
 * @param chi
 * @returns
 */
export const createSetRatesInstruction = (
  swapProgramId: web3.PublicKey,
  swapAccount: web3.PublicKey,
  permissionAccount: web3.PublicKey,
  authority: web3.PublicKey,
  ssr: bigint,
  rho: bigint,
  chi: bigint
): web3.TransactionInstruction => {
  // Encode instruction data to buffer
  const data = Buffer.alloc(SetRatesInstructionLayout.span);
  SetRatesInstructionLayout.encode(
    {
      instruction: 6,
      ssr,
      rho,
      chi,
    },
    data
  );

  return new web3.TransactionInstruction({
    keys: [
      { pubkey: swapAccount, isWritable: true, isSigner: false },
      { pubkey: permissionAccount, isWritable: false, isSigner: false },
      { pubkey: authority, isWritable: false, isSigner: true },
    ],
    programId: swapProgramId,
    data,
  });
};
