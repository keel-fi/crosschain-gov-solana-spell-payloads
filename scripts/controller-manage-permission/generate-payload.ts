// Generates a payload for creating/updating a ALM Controller Permission account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getManagePermissionInstruction,
} from "@keel-fi/svm-alm-controller";
import { ACTION, CONFIG, PERMISSIONS } from "./config";
import { deriveControllerAuthorityPda, derivePermissionPda } from "@keel-fi/svm-alm-controller";
const printControllerManagePermissionPayload = async () => {
  const args = readArgs(ACTION);
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(CONFIG.controller),
  );
  const permissionPda = await derivePermissionPda(
    address(CONFIG.controller),
    address(CONFIG.authority),
  );

  const superPermissionPda = await derivePermissionPda(
    address(CONFIG.controller),
    address(CONFIG.superAuthority),
  );
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const instruction = getManagePermissionInstruction({
    payer: createNoopSigner(lzPayerSentinel),
    controller: address(CONFIG.controller),
    controllerAuthority: controllerAuthority,
    // NOTE: we do not use sentinel here because it cannot be used
    // above for PDA derivation.
    superAuthority: createNoopSigner(address(CONFIG.superAuthority)),
    superPermission: superPermissionPda,
    authority: address(CONFIG.authority),
    permission: permissionPda,
    programId: address(CONFIG.controllerProgramId),
    systemProgram: fromLegacyPublicKey(web3.SystemProgram.programId),
    ...PERMISSIONS,
  });
  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerManagePermissionPayload();
