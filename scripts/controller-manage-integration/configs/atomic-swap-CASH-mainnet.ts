import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  MAINNET_PAYER,
  ATOMIC_SWAP_CASH_TO_USDC_INTEGRATION,
} from "../../../src";

export default {
  outputFile: "controller-manage-integration-atomic-swap-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  integration: ATOMIC_SWAP_CASH_TO_USDC_INTEGRATION,
};
