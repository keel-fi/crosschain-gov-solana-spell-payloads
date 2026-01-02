import { IntegrationStatus, kamino } from "@keel-fi/svm-alm-controller";
import { KAMINO_MAIN_MARKET, KAMINO_PYUSD_FARM_COLLATERAL, KAMINO_PYUSD_RESERVE, KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, PYUSD_MINT, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID } from "../../../src";

export default {
  outputFile: "controller-initialize-kamino-integration-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER_2,
  status: IntegrationStatus.Active,
  description: "Kamino Main PYUSD",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  obligationId: 0,
  market: KAMINO_MAIN_MARKET,
  reserve: KAMINO_PYUSD_RESERVE,
  reserveLiquidityMint: PYUSD_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_PYUSD_FARM_COLLATERAL,
};

