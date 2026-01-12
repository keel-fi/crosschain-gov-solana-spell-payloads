// Generates a payload for initializing a ALM Controller Reserve account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readConfigFromFile,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { Address, address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getInitializeReserveInstruction,
  deriveReservePda,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  ReserveStatus,
} from "@keel-fi/svm-alm-controller";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ACTION, ControllerInitializeReserveConfig } from "./config";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

const printControllerInitializeReservePayload = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerInitializeReserveConfig>(args.config);

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
  const vaultPda = getAssociatedTokenAddressSync(
    new web3.PublicKey(config.mint),
    new web3.PublicKey(controllerAuthority),
    true,
    new web3.PublicKey(config.tokenProgram)
  );

  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const instruction = getInitializeReserveInstruction({
    payer: createNoopSigner(lzPayerSentinel),
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    // NOTE: we do not use sentinel here because it cannot be used
    // above for PDA derivation.
    authority: createNoopSigner(address(config.authority)),
    permission: permissionPda,
    reserve: reservePda,
    mint: address(config.mint),
    vault: address(vaultPda.toString()),
    tokenProgram: address(config.tokenProgram),
    associatedTokenProgram: address(ASSOCIATED_TOKEN_PROGRAM_ID.toString()),
    programId: address(config.controllerProgramId),
    systemProgram: fromLegacyPublicKey(web3.SystemProgram.programId),
    status: config.status,
    rateLimitSlope: config.rateLimitSlope,
    rateLimitMaxOutflow: config.rateLimitMaxOutflow,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(config.outputFile, payload);
};

printControllerInitializeReservePayload();
