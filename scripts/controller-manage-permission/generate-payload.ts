// Generates a payload for creating/updating a ALM Controller Permission account

import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkConfig,
  serializeLzInstruction,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  getManagePermissionInstruction,
} from "@keel-fi/svm-alm-controller";
import { NETWORK_CONFIGS, PERMISSIONS } from "./config";

const printControllerManagePermissionPayload = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );
  const superPermissionPda = await derivePermissionPda(
    address(config.controller),
    // NOTE: cannot use sentinel here as it breaks the PDA.
    address(config.superAuthority)
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
    ...PERMISSIONS,
  });
  const payload = serializeLzInstruction(
    convertKitInstructionToWeb3Js(instruction)
  );

  fs.writeFileSync("output.json", JSON.stringify(payload.toJSON().data));

  console.log("Instruction Payload: ", payload);
};

printControllerManagePermissionPayload();
