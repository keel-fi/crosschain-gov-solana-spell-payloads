import {
  IntegrationStatus,
  IntegrationType,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  Network,
  Stablecoin,
  NetworkStablecoinConfig,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
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
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerInitializeAtomicSwapIntegration> = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Atomic Swap Integration for USDG",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      maxSlippageBps: 100, // 1% slippage
      maxStaleness: 300n, // 5 minutes in seconds
      expiryTimestamp: 0n, // TODO: update to actual expiry
      oraclePriceInverted: false,
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Atomic Swap Integration for PYUSD",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      maxSlippageBps: 100, // 1% slippage
      maxStaleness: 300n, // 5 minutes in seconds
      expiryTimestamp: 0n, // TODO: update to actual expiry
      oraclePriceInverted: false,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Atomic Swap Integration for CASH",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      maxSlippageBps: 100, // 1% slippage
      maxStaleness: 300n, // 5 minutes in seconds
      expiryTimestamp: 0n, // TODO: update to actual expiry
      oraclePriceInverted: false,
    },
  },
  mainnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      // TODO: update to actual authority
      authority: "",
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Atomic Swap Integration for USDG",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      maxSlippageBps: 100, // TODO: update to actual max slippage
      maxStaleness: 300n, // TODO: update to actual max staleness
      expiryTimestamp: 0n, // TODO: update to actual expiry
      oraclePriceInverted: false,
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      // TODO: update to actual authority
      authority: "",
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Atomic Swap Integration for PYUSD",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      maxSlippageBps: 100, // TODO: update to actual max slippage
      maxStaleness: 300n, // TODO: update to actual max staleness
      expiryTimestamp: 0n, // TODO: update to actual expiry
      oraclePriceInverted: false,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      // TODO: update to actual authority
      authority: "",
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Atomic Swap Integration for CASH",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      maxSlippageBps: 100, // TODO: update to actual max slippage
      maxStaleness: 300n, // TODO: update to actual max staleness
      expiryTimestamp: 0n, // TODO: update to actual expiry
      oraclePriceInverted: false,
    },
  },
};

