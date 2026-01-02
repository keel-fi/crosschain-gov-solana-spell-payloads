import { IntegrationStatus, kamino } from "@keel-fi/svm-alm-controller";
import { CASH_MINT, KAMINO_CASH_FARM_COLLATERAL, KAMINO_CASH_RESERVE, KAMINO_MAIN_MARKET, KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID } from "../../../src";

export default {
  outputFile: "controller-initialize-kamino-integration-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER_2,
  status: IntegrationStatus.Active,
  description: "Kamino Main CASH",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  obligationId: 0,
  market: KAMINO_MAIN_MARKET,
  reserve: KAMINO_CASH_RESERVE,
  reserveLiquidityMint: CASH_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_CASH_FARM_COLLATERAL,
};

