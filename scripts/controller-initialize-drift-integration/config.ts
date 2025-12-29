import {
  IntegrationStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  NetworkStablecoinConfig,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  PYUSD_MINT,
  CASH_MINT,
  DRIFT_CASH_SPOT_MARKET_INDEX,
  DRIFT_POOL_ID,
  DRIFT_PYUSD_SPOT_MARKET_INDEX,
  BaseControllerIntegrationConfig,
} from "../../src";

export const ACTION = "controller-initialize-drift-integration";

type ControllerInitializeDriftIntegration = BaseControllerIntegrationConfig & {
  // Mint address
  mint: string;
  // Drift specific args
  subAccountId: number;
  spotMarketIndex: number;
  poolId: number;
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerInitializeDriftIntegration> = {
  devnet: {
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Drift Main PYUSD",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
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
      description: "Drift Main CASH",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: false,
      mint: CASH_MINT,
      subAccountId: 0, // TODO: update to actual sub account ID
      spotMarketIndex: 0, // TODO: update to actual spot market index
      poolId: 0, // TODO: update to actual pool ID
    },
  },
  mainnet: {
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Drift Main PYUSD",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: true,
      mint: PYUSD_MINT,
      subAccountId: 0,
      spotMarketIndex: DRIFT_PYUSD_SPOT_MARKET_INDEX,
      poolId: DRIFT_POOL_ID,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Drift Main CASH",
      rateLimitSlope: 10_000_000_000_000n,
      rateLimitMaxOutflow: 25_000_000_000_000n,
      permitLiquidation: true,
      mint: CASH_MINT,
      subAccountId: 0,
      spotMarketIndex: DRIFT_CASH_SPOT_MARKET_INDEX,
      poolId: DRIFT_POOL_ID,
    },
  },
};

