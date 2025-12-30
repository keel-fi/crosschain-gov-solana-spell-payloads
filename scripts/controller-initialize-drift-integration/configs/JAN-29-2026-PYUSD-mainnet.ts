import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  PYUSD_MINT,
  DRIFT_PYUSD_SPOT_MARKET_INDEX,
  DRIFT_POOL_ID,
} from "../../../src";

export default {
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
};

