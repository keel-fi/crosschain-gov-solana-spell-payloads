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

export type ControllerInitializeDriftIntegrationConfig = BaseControllerIntegrationConfig & {
  // Mint address
  mint: string;
  // Drift specific args
  subAccountId: number;
  spotMarketIndex: number;
  poolId: number;
};

