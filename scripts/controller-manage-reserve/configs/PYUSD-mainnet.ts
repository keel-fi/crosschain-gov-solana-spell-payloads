import { ReserveStatus } from "@keel-fi/svm-alm-controller";
import { KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, PYUSD_MINT, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID } from "../../../src";

export default {
  outputFile: "controller-manage-reserve-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  mint: PYUSD_MINT,
  payer: MAINNET_PAYER_2,
  status: ReserveStatus.Active,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
};

