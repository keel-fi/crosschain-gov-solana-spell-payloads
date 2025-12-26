import {
  IntegrationStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  NetworkStablecoinConfig,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDG_MINT,
  PYUSD_MINT,
  CASH_MINT,
} from "../../src";

export const ACTION = "controller-initialize-atomic-swap-integration";

type ControllerInitializeAtomicSwapIntegration = {
  controllerProgramId: string;
  // Controller that the Integration applies to
  controller: string;
  // Authority that has permission to initialize the integration
  authority: string;
  payer: string;
  // Integration status
  status: IntegrationStatus;
  // Description of the integration
  description: string;
  // Rate limit slope
  rateLimitSlope: bigint;
  // Rate limit max outflow
  rateLimitMaxOutflow: bigint;
  // Permit liquidation
  permitLiquidation: boolean;
  // Atomic swap specific args
  maxSlippageBps: number;
  maxStaleness: bigint;
  expiryTimestamp: bigint;
  oraclePriceInverted: boolean;
  inputTokenMint: string;
  outputTokenMint: string;
  oracle: string;
  inputMintDecimals: number;
  outputMintDecimals: number;
};

/**
 * Network configs
 */
export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerInitializeAtomicSwapIntegration> = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Atomic Swap for USDG",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: false,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: BigInt(1866674216),
      oraclePriceInverted: false,
      inputTokenMint: USDG_MINT,
      outputTokenMint: USDG_MINT,
      oracle: "",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Atomic Swap for PYUSD",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: false,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: BigInt(1866674216),
      oraclePriceInverted: false,
      inputTokenMint: USDG_MINT,
      outputTokenMint: USDG_MINT,
      oracle: "",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Atomic Swap for CASH",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: false,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: BigInt(1866674216),
      oraclePriceInverted: false,
      inputTokenMint: USDG_MINT,
      outputTokenMint: USDG_MINT,
      oracle: "",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
  },
  mainnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Atomic Swap for USDG",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: false,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: BigInt(1866674216),
      oraclePriceInverted: false,
      inputTokenMint: USDG_MINT,
      outputTokenMint: "",
      oracle: "",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Atomic Swap for PYUSD",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: false,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: BigInt(1866674216),
      oraclePriceInverted: false,
      inputTokenMint: PYUSD_MINT,
      outputTokenMint: "",
      oracle: "",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Atomic Swap for CASH",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: false,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: BigInt(1866674216),
      oraclePriceInverted: true, // Oracle has USDC as base_mint and CASH as quote_mint, so inverted
      inputTokenMint: CASH_MINT,
      outputTokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      oracle: "63MhziM5prCQkykzfciCuDo1iezd8tqQUHkK1nT7NWY",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
  },
};

