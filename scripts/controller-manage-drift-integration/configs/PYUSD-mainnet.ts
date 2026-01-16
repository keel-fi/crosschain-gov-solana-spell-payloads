import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  DRIFT_POOL_ID,
  DRIFT_PYUSD_SPOT_MARKET_INDEX,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  MAINNET_PAYER,
  PYUSD_MINT,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
} from "../../../src";

export default {
  outputFile: "controller-manage-drift-integration-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  mint: PYUSD_MINT,
  subAccountId: 0,
  spotMarketIndex: DRIFT_PYUSD_SPOT_MARKET_INDEX,
  poolId: DRIFT_POOL_ID,
};
