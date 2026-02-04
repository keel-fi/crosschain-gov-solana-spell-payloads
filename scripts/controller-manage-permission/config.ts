import { PermissionStatus } from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-permission";

export type ControllerManagePermissionConfig = {
  outputFile: string;
  controllerProgramId: string;
  // Controller that the Permissions apply to
  controller: string;
  // Authority where Permissions will be created/updated
  authority: string;
  // Super Authority that has the ability to ManagePermissions
  superAuthority: string;
  payer: string;
  // Permission settings
  status: PermissionStatus;
  canManagePermissions: boolean;
  canInvokeExternalTransfer: boolean;
  canExecuteSwap: boolean;
  canReallocate: boolean;
  canFreezeController: boolean;
  canUnfreezeController: boolean;
  canManageReservesAndIntegrations: boolean;
  canSuspendPermissions: boolean;
  canLiquidate: boolean;
};
