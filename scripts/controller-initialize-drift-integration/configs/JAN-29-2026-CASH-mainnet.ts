import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  CASH_MINT,
  DRIFT_CASH_SPOT_MARKET_INDEX,
  DRIFT_POOL_ID,
  MAINNET_PAYER,
} from "../../../src";

export default {
  outputFile: "controller-initialize-drift-integration-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: "Drift Main CASH",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  mint: CASH_MINT,
  subAccountId: 0,
  spotMarketIndex: DRIFT_CASH_SPOT_MARKET_INDEX,
  poolId: DRIFT_POOL_ID,
};

