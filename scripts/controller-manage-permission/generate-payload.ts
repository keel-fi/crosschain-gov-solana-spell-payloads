// Generates a payload for creating/updating a ALM Controller Permission account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { Address, address, createNoopSigner, getAddressEncoder } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getManagePermissionInstruction,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS, PERMISSIONS } from "./config";
import { deriveControllerAuthorityPda, derivePermissionPda } from "../../src";

const printControllerManagePermissionPayload = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
    address(config.controllerProgramId)
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority),
    address(config.controllerProgramId)
  );

  const superPermissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.superAuthority),
    address(config.controllerProgramId)
  );
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const instruction = getManagePermissionInstruction({
    payer: createNoopSigner(lzPayerSentinel),
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    // NOTE: we do not use sentinel here because it cannot be used
    // above for PDA derivation.
    superAuthority: createNoopSigner(address(config.superAuthority)),
    superPermission: address(superPermissionPda.toString()),
    authority: address(config.authority),
    permission: permissionPda,
    programId: address(config.controllerProgramId),
    systemProgram: fromLegacyPublicKey(web3.SystemProgram.programId),
    ...PERMISSIONS,
  });
  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerManagePermissionPayload();
