import {
  PermissionStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  Network,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  MAINNET_PAYER,
} from "../../src";

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
    controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
    controller: SVM_ALM_CONTROLLER,
    authority: "9tSZj13gLcuvsXWRLo7xW7d8n1mNndJmKxZX4xmxqcxU",
    superAuthority: KEEL_SUB_PROXY_CPI_AUTHORITY,
    payer: MAINNET_PAYER,
  },
  surfpool: {
    controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
    controller: SVM_ALM_CONTROLLER,
    authority: "9tSZj13gLcuvsXWRLo7xW7d8n1mNndJmKxZX4xmxqcxU",
    superAuthority: KEEL_SUB_PROXY_CPI_AUTHORITY,
    payer: MAINNET_PAYER,
  },
};

// PERMISSIONS should be modified to match the desired permissions for the authority
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
