// Generates a payload for managing a Controller account

import {
  convertKitInstructionToWeb3Js,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import {
  getManageControllerInstruction,
  deriveControllerAuthorityPda,
  derivePermissionPda,
} from "@keel-fi/svm-alm-controller";
import { ACTION, CONFIG } from "./config";

const printControllerManageControllerPayload = async () => {
  const args = readArgs(ACTION);

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(CONFIG.controller)
  );
  const permissionPda = await derivePermissionPda(
    address(CONFIG.controller),
    address(CONFIG.authority)
  );
  const instruction = getManageControllerInstruction({
    controller: address(CONFIG.controller),
    controllerAuthority: controllerAuthority,
    authority: createNoopSigner(address(CONFIG.authority)),
    permission: permissionPda,
    programId: address(CONFIG.controllerProgramId),
    status: CONFIG.status,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerManageControllerPayload();

