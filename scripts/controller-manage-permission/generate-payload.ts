// Generates a payload for creating/updating a ALM Controller Permission account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readArgs,
  readConfigFromFile,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getManagePermissionInstruction,
  deriveControllerAuthorityPda,
  derivePermissionPda,
} from "@keel-fi/svm-alm-controller";
import { ACTION, ControllerManagePermissionConfig } from "./config";

const printControllerManagePermissionPayload = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerManagePermissionConfig>(args.config);

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority),
  );

  const superPermissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.superAuthority),
  );
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const instruction = getManagePermissionInstruction({
    payer: createNoopSigner(lzPayerSentinel),
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    // NOTE: we do not use sentinel here because it cannot be used
    // above for PDA derivation.
    superAuthority: createNoopSigner(address(config.superAuthority)),
    superPermission: superPermissionPda,
    authority: address(config.authority),
    permission: permissionPda,
    programId: address(config.controllerProgramId),
    systemProgram: fromLegacyPublicKey(web3.SystemProgram.programId),
    status: config.status,
    canManagePermissions: config.canManagePermissions,
    canInvokeExternalTransfer: config.canInvokeExternalTransfer,
    canExecuteSwap: config.canExecuteSwap,
    canReallocate: config.canReallocate,
    canFreezeController: config.canFreezeController,
    canUnfreezeController: config.canUnfreezeController,
    canManageReservesAndIntegrations: config.canManageReservesAndIntegrations,
    canSuspendPermissions: config.canSuspendPermissions,
    canLiquidate: config.canLiquidate,
  });
  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(config.outputFile, payload);
};

printControllerManagePermissionPayload();
