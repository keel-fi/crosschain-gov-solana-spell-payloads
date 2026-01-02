import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import { DRIFT_POOL_ID, DRIFT_PYUSD_SPOT_MARKET_INDEX, KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, PYUSD_MINT, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID } from "../../../src";

export default {
  outputFile: "controller-initialize-drift-integration-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER_2,
  status: IntegrationStatus.Active,
  description: "Drift Main PYUSD",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  mint: PYUSD_MINT,
  subAccountId: 0,
  spotMarketIndex: DRIFT_PYUSD_SPOT_MARKET_INDEX,
  poolId: DRIFT_POOL_ID,
};

