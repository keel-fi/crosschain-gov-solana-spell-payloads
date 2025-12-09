import {
  PermissionStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import { Network } from "../../src";

export const ACTION = "controller-manage-permission";

type ControllerManagePermission = {
  controllerProgramId: string;
  // Controller that the Permissions apply to
  controller: string;
  // Authority where Permissions will be created/updated
  authority: string;
  // Super Authority that has the ability to ManagePermissions
  superAuthority: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, ControllerManagePermission> = {
  devnet: {
    controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
    controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
    authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
    superAuthority: "JDNDBYaXdNiD7peLgRP3TZKwkeCJ3QEFwYkHk6DWbb75",
    payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  },
  mainnet: {
    controllerProgramId: "ALM1JSnEhc5PkNecbSZotgprBuJujL5objTbwGtpTgTd",
    controller: "EeobZr57FSmNvw8Hs719iULJNqv3XLrTB5uPezvC2ND3",
    // This is a dummy authority. TODO: update to actual authority later.
    authority: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    superAuthority: "FDFsoboECfazAq1eLvwBLZXhoxjPvTy4wCzPdbqnk7Zk",
    payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
  },
};

// Network agnostic Permissions matrix
export const PERMISSIONS = {
  status: PermissionStatus.Active,
  canManagePermissions: false,
  canInvokeExternalTransfer: false,
  canExecuteSwap: true,
  canReallocate: true,
  canFreezeController: false,
  canUnfreezeController: false,
  canManageReservesAndIntegrations: false,
  canSuspendPermissions: false,
  canLiquidate: false,
};
