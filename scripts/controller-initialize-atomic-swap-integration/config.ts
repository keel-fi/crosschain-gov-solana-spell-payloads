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
  USDC_MINT,
  I64_MAX,
  BaseControllerIntegrationConfig,
} from "../../src";

export const ACTION = "controller-initialize-atomic-swap-integration";

type ControllerInitializeAtomicSwapIntegration = BaseControllerIntegrationConfig & {
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
      permitLiquidation: true,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: I64_MAX,
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
      permitLiquidation: true,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: I64_MAX,
      oraclePriceInverted: false,
      inputTokenMint: PYUSD_MINT,
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
      permitLiquidation: true,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: I64_MAX,
      oraclePriceInverted: false,
      inputTokenMint: CASH_MINT,
      outputTokenMint: USDG_MINT,
      oracle: "",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
  },
  // TODO: The following mainnet configurations are incomplete and require post-audit implementation:
  // - USDG: Missing outputTokenMint (target swap token) and oracle (price feed address)
  // - PYUSD: Missing outputTokenMint (target swap token) and oracle (price feed address)
  // - CASH: Missing outputTokenMint (target swap token) and oracle (price feed address)
  //
  // Rationale: These values depend on finalizing cross-token swap support and oracle integrations,
  // which require additional audit coverage. The outputTokenMint should be set to the target
  // stablecoin for each swap pair (e.g., USDC), and oracle should point to the verified price
  // feed for that pair. These integrations cannot be deployed until these values are populated.
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
      permitLiquidation: true,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: I64_MAX,
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
      permitLiquidation: true,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: I64_MAX,
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
      permitLiquidation: true,
      maxSlippageBps: 10,
      maxStaleness: 100n,
      expiryTimestamp: I64_MAX,
      oraclePriceInverted: false,
      inputTokenMint: CASH_MINT,
      outputTokenMint: "",
      oracle: "",
      inputMintDecimals: 6,
      outputMintDecimals: 6,
    },
  },
};

