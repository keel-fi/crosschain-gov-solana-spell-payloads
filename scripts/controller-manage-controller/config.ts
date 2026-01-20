import {
  ControllerStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  Network,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  DEVNET_CONTROLLER,
  KEEL_DEPLOYER,
  DEVNET_PAYER,
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

export const NETWORK_CONFIGS: Record<Network, ControllerManageController> = {
  devnet: {
    controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
    controller: DEVNET_CONTROLLER,
    authority: KEEL_DEPLOYER,
    payer: DEVNET_PAYER,
    status: ControllerStatus.Active,
  },
  mainnet: {
    controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
    controller: SVM_ALM_CONTROLLER,
    authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
    payer: MAINNET_PAYER,
    status: ControllerStatus.PushPullFrozen,
  },
  surfpool: {
    controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
    controller: SVM_ALM_CONTROLLER,
    authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
    payer: MAINNET_PAYER,
    status: ControllerStatus.PushPullFrozen,
  },
};

