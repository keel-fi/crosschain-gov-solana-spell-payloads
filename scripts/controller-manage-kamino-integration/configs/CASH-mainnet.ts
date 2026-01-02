import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  CASH_MINT,
  KAMINO_MAIN_MARKET,
  KAMINO_CASH_RESERVE,
  KAMINO_CASH_FARM_COLLATERAL,
} from "../../../src";
import { kamino } from "@keel-fi/svm-alm-controller";

export default {
  outputFile: "controller-manage-kamino-integration-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  obligationId: 0,
  market: KAMINO_MAIN_MARKET,
  reserve: KAMINO_CASH_RESERVE,
  reserveLiquidityMint: CASH_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_CASH_FARM_COLLATERAL,
};

