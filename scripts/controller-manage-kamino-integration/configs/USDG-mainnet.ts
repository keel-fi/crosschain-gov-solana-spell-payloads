import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDG_MINT,
  KAMINO_MAIN_MARKET,
  KAMINO_USDG_RESERVE,
  KAMINO_USDG_FARM_COLLATERAL,
} from "../../../src";
import { kamino } from "@keel-fi/svm-alm-controller";

export default {
  outputFile: "controller-manage-kamino-integration-USDG-mainnet.txt",
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
  reserve: KAMINO_USDG_RESERVE,
  reserveLiquidityMint: USDG_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_USDG_FARM_COLLATERAL,
};

