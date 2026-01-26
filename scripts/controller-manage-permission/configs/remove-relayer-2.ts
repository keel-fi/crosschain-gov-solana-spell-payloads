import { PermissionStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  MAINNET_PAYER,
} from "../../../src";

export default {
  outputFile: "controller-manage-permission-remove-relayer-2-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: "2gDBGyhU8M96JDMWzCfiGb3Pw2HvrEvdL5MkfwosBYnh",
  superAuthority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  // Permission settings
  status: PermissionStatus.Suspended,
  canManagePermissions: false,
  canInvokeExternalTransfer: false,
  canExecuteSwap: false,
  canReallocate: false,
  canFreezeController: false,
  canUnfreezeController: false,
  canManageReservesAndIntegrations: false,
  canSuspendPermissions: false,
  canLiquidate: false,
};
