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
  DRIFT_CASH_SPOT_MARKET_INDEX,
  DRIFT_POOL_ID,
  DRIFT_PYUSD_SPOT_MARKET_INDEX,
} from "../../src";

export const ACTION = "controller-manage-drift-integration";

type ControllerManageDriftIntegration = {
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
  // Mint address (used to identify the integration)
  mint: string;
  // Drift specific args (used to derive integration PDA)
  subAccountId: number;
  spotMarketIndex: number;
  poolId: number;
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerManageDriftIntegration> = {
  devnet: {
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: null, // null means no change
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
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
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      mint: CASH_MINT,
      subAccountId: 0,
      spotMarketIndex: DRIFT_CASH_SPOT_MARKET_INDEX,
      poolId: DRIFT_POOL_ID,
    },
  },
};

