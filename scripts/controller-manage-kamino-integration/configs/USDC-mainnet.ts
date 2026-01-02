import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDC_MINT,
  KAMINO_MAIN_MARKET,
  KAMINO_CASH_FARM_COLLATERAL,
  MAINNET_PAYER,
  KAMINO_USDC_RESERVE,
} from "../../../src";
import { kamino } from "@keel-fi/svm-alm-controller";

export default {
  outputFile: "controller-manage-kamino-integration-USDC-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: "Kamino Main USDC",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  obligationId: 0,
  market: KAMINO_MAIN_MARKET,
  reserve: KAMINO_USDC_RESERVE,
  reserveLiquidityMint: USDC_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_CASH_FARM_COLLATERAL,
};

