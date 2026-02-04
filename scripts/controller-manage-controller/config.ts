import { ControllerStatus } from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-controller";

export type ControllerManageControllerConfig = {
  outputFile: string;
  controllerProgramId: string;
  // Controller that will be managed
  controller: string;
  // Authority that has permission to manage the controller
  authority: string;
  payer: string;
  // Controller status
  status: ControllerStatus;
};

