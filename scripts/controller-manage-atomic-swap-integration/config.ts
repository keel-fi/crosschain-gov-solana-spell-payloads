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

export const ACTION = "controller-manage-atomic-swap-integration";

type ControllerManageAtomicSwapIntegration = {
  controllerProgramId: string;
  // Controller that the Integration applies to
  controller: string;
  // Authority that has permission to manage the integration
  authority: string;
  payer: string;
  // Integration status (optional - null means no change)
  status: IntegrationStatus | null;
  // Description of the integration (optional - null means no change)
  description: string | null;
  // Rate limit slope (optional - null means no change)
  rateLimitSlope: bigint | null;
  // Rate limit max outflow (optional - null means no change)
  rateLimitMaxOutflow: bigint | null;
  // Atomic swap specific args (used to derive integration PDA)
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

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerManageAtomicSwapIntegration> = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: null, // null means no change
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
      oraclePriceInverted: true, // Oracle has USDC as base_mint and CASH as quote_mint, so inverted
      inputTokenMint: CASH_MINT,
      outputTokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      oracle: "63MhziM5prCQkykzfciCuDo1iezd8tqQUHkK1nT7NWY",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
  },
};

