import { IntegrationStatus, kamino } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  PYUSD_MINT,
  KAMINO_MAIN_MARKET,
  KAMINO_PYUSD_RESERVE,
  KAMINO_PYUSD_FARM_COLLATERAL,
  MAINNET_PAYER,
} from "../../../src";

export default {
  outputFile: "controller-initialize-kamino-integration-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
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

