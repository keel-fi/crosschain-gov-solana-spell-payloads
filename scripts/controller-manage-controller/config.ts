import {
  ControllerStatus,
} from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  MAINNET_PAYER,
} from "../../src";

export const ACTION = "controller-manage-controller";

type ControllerManageController = {
  controllerProgramId: string;
  // Controller that will be managed
  controller: string;
  // Authority that has permission to manage the controller
  authority: string;
  payer: string;
  // Controller status
  status: ControllerStatus;
};

export const CONFIG: ControllerManageController = {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: ControllerStatus.PushPullFrozen,
};

