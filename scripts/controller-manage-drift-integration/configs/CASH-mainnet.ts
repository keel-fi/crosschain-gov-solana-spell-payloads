import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  CASH_MINT,
  DRIFT_CASH_SPOT_MARKET_INDEX,
  DRIFT_POOL_ID,
} from "../../../src";

export default {
  outputFile: "controller-manage-drift-integration-CASH-mainnet.txt",
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
};

