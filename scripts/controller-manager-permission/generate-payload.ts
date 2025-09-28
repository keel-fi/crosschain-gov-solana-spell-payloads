// Generates a payload for updating the Solana PSM SSR via crosschain governance message.

import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  getManagePermissionInstruction,
  LZ_PAYER_PLACEHOLDER,
  PermissionStatus,
  serializeLzInstruction,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";

// Controller that the Permissions apply to
const CONTROLLER = address("TODO");
// Authority where Permissions will be created/updated
const AUTHORITY = address("TODO");
// Super Authority that has the ability to ManagePermissions
const SUPER_AUTHORITY = address("TODO");

const PAYER = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

// Permissions matrix
const PERMISSIONS = {
  status: PermissionStatus.Active,
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
  const payload = serializeLzInstruction(instruction);

  fs.writeFileSync("output.json", JSON.stringify(payload.toJSON().data));

  console.log("Upgrade Instruction Payload: ", payload);
};

printControllerManagePermissionPayload();
