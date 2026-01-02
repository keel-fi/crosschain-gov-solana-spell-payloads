import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDC_MINT,
  KAMINO_MAIN_MARKET,
  KAMINO_CASH_FARM_COLLATERAL,
} from "../../../src";
import { kamino } from "@keel-fi/svm-alm-controller";

export default {
  outputFile: "controller-manage-kamino-integration-USDC-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: "2rRM7kWjWjS7CGoRnSHTMu4daS24YAA9BgcP1qo2v1UC",
  status: IntegrationStatus.Active,
  description: "Kamino Main USDC",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  obligationId: 0,
  market: KAMINO_MAIN_MARKET,
  reserve: "D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59",
  reserveLiquidityMint: USDC_MINT,
  referrer: kamino.KAMINO_LEND_PROGRAM_ID,
  reserveFarmCollateral: KAMINO_CASH_FARM_COLLATERAL,
};

