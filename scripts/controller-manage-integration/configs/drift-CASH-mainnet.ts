import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  MAINNET_PAYER,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  DRIFT_CASH_INTEGRATION,
} from "../../../src";

export default {
  outputFile: "controller-manage-integration-drift-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  integration: DRIFT_CASH_INTEGRATION,
};
