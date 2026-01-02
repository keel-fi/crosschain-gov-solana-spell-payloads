import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDC_MINT,
  DRIFT_POOL_ID,
  MAINNET_PAYER,
} from "../../../src";

export default {
  outputFile: "controller-manage-drift-integration-USDC-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: "Drift Main USDC",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  mint: USDC_MINT,
  subAccountId: 0,
  spotMarketIndex: 0,
  poolId: DRIFT_POOL_ID,
};

