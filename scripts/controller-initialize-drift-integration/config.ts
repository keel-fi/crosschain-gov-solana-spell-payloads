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
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDG_MINT,
  PYUSD_MINT,
  CASH_MINT,
} from "../../src";

export const ACTION = "controller-initialize-drift-integration";

type ControllerInitializeDriftIntegration = {
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
  // Mint address
  mint: string;
  // Drift specific args
  subAccountId: number;
  spotMarketIndex: number;
  poolId: number;
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerInitializeDriftIntegration> = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Drift Integration for USDG",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      mint: USDG_MINT,
      subAccountId: 0, // TODO: update to actual sub account ID
      spotMarketIndex: 0, // TODO: update to actual spot market index
      poolId: 0, // TODO: update to actual pool ID
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Drift Integration for PYUSD",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      mint: PYUSD_MINT,
      subAccountId: 0, // TODO: update to actual sub account ID
      spotMarketIndex: 0, // TODO: update to actual spot market index
      poolId: 0, // TODO: update to actual pool ID
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Drift Integration for CASH",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      mint: CASH_MINT,
      subAccountId: 0, // TODO: update to actual sub account ID
      spotMarketIndex: 0, // TODO: update to actual spot market index
      poolId: 0, // TODO: update to actual pool ID
    },
  },
  mainnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Drift Integration for USDG",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      mint: USDG_MINT,
      subAccountId: 0, // TODO: update to actual sub account ID
      spotMarketIndex: 0, // TODO: update to actual spot market index
      poolId: 0, // TODO: update to actual pool ID
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Drift Integration for PYUSD",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      mint: PYUSD_MINT,
      subAccountId: 0,
      spotMarketIndex: 22,
      poolId: 0,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Drift Integration for CASH",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      mint: CASH_MINT,
      subAccountId: 0,
      spotMarketIndex: 61,
      poolId: 0,
    },
  },
};

