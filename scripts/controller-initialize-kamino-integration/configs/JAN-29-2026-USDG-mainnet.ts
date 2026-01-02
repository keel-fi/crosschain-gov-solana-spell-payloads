import { IntegrationStatus, kamino } from "@keel-fi/svm-alm-controller";
import { KAMINO_MAIN_MARKET, KAMINO_USDG_FARM_COLLATERAL, KAMINO_USDG_RESERVE, KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID, USDG_MINT } from "../../../src";

export default {
  outputFile: "controller-initialize-kamino-integration-USDG-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER_2,
  status: IntegrationStatus.Active,
  description: "Kamino Main USDG",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  obligationId: 0,
  market: KAMINO_MAIN_MARKET,
  reserve: KAMINO_USDG_RESERVE,
  reserveLiquidityMint: USDG_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_USDG_FARM_COLLATERAL,
};

