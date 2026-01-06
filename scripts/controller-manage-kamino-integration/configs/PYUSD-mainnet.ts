import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  KAMINO_MAIN_MARKET,
  KAMINO_PYUSD_FARM_COLLATERAL,
  KAMINO_PYUSD_RESERVE,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  MAINNET_PAYER,
  PYUSD_MINT,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
} from "../../../src";
import { kamino } from "@keel-fi/svm-alm-controller";

export default {
  outputFile: "controller-manage-kamino-integration-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  obligationId: 0,
  market: KAMINO_MAIN_MARKET,
  reserve: KAMINO_PYUSD_RESERVE,
  reserveLiquidityMint: PYUSD_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_PYUSD_FARM_COLLATERAL,
};
