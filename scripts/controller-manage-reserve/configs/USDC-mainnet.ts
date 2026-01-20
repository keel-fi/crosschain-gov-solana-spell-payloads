import { ReserveStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDC_MINT,
  MAINNET_PAYER,
} from "../../../src";

export default {
  outputFile: "controller-manage-reserve-USDC-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  mint: USDC_MINT,
  payer: MAINNET_PAYER,
  status: ReserveStatus.Suspended,
  rateLimitSlope: null, // null means no change
  rateLimitMaxOutflow: null, // null means no change
};

