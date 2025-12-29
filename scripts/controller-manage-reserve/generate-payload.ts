// Generates a payload for managing a Reserve account

import {
  convertKitInstructionToWeb3Js,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import {
  getManageReserveInstruction,
  deriveReservePda,
  deriveControllerAuthorityPda,
  derivePermissionPda,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printControllerManageReservePayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );
  const reservePda = await deriveReservePda(
    address(config.controller),
    address(config.mint)
  );

  const instruction = getManageReserveInstruction({
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    authority: createNoopSigner(address(config.authority)),
    permission: permissionPda,
    reserve: reservePda,
    programId: address(config.controllerProgramId),
    status: config.status,
    rateLimitSlope: config.rateLimitSlope,
    rateLimitMaxOutflow: config.rateLimitMaxOutflow,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerManageReservePayload();

