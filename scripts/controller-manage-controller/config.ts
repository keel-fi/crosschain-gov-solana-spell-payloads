import {
  ControllerStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  Network,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
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
    controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
    authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
    payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    status: ControllerStatus.Active,
  },
  mainnet: {
    controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
    controller: SVM_ALM_CONTROLLER,
    authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
    payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
    status: ControllerStatus.Active,
  },
};

