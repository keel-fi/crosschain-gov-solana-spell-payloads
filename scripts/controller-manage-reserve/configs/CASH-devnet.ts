import { ReserveStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { DEVNET_CONTROLLER, KEEL_DEPLOYER, DEVNET_PAYER } from "../../../src";

export default {
  outputFile: "controller-manage-reserve-CASH-devnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: DEVNET_CONTROLLER,
  authority: KEEL_DEPLOYER,
  mint: "", // TODO: update to actual CASH mint
  payer: DEVNET_PAYER,
  status: ReserveStatus.Active,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
};

