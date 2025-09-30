// Generates a payload for creating/updating a ALM Controller Permission account

import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  serializeLzInstruction,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  getManagePermissionInstruction,
  PermissionStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";

// Controller that the Permissions apply to
const CONTROLLER = address("4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6");
// Authority where Permissions will be created/updated
const AUTHORITY = address("PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2");
// Super Authority that has the ability to ManagePermissions
const SUPER_AUTHORITY = address("JDNDBYaXdNiD7peLgRP3TZKwkeCJ3QEFwYkHk6DWbb75");

const PAYER = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

// Permissions matrix
const PERMISSIONS = {
  status: PermissionStatus.Active,
  canManagePermissions: false,
  canInvokeExternalTransfer: false,
  canExecuteSwap: false,
  canReallocate: true,
  canFreezeController: false,
  canUnfreezeController: false,
  canManageReservesAndIntegrations: false,
  canSuspendPermissions: false,
  canLiquidate: false,
};

const printControllerManagePermissionPayload = async () => {
  const controllerAuthority = await deriveControllerAuthorityPda(CONTROLLER);
  const permissionPda = await derivePermissionPda(CONTROLLER, AUTHORITY);
  const superPermissionPda = await derivePermissionPda(
    CONTROLLER,
    SUPER_AUTHORITY
  );
  const instruction = getManagePermissionInstruction({
    payer: createNoopSigner(PAYER),
    controller: CONTROLLER,
    controllerAuthority: controllerAuthority,
    superAuthority: createNoopSigner(SUPER_AUTHORITY),
    superPermission: superPermissionPda,
    authority: AUTHORITY,
    permission: permissionPda,
    programId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
    systemProgram: fromLegacyPublicKey(web3.SystemProgram.programId),
    ...PERMISSIONS,
  });
  const payload = serializeLzInstruction(
    convertKitInstructionToWeb3Js(instruction)
  );

  fs.writeFileSync("output.json", JSON.stringify(payload.toJSON().data));

  console.log("Upgrade Instruction Payload: ", payload);
};

printControllerManagePermissionPayload();
