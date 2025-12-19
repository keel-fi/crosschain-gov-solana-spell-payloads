// Generates a payload for initializing a ALM Controller Reserve account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
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
} from "@keel-fi/svm-alm-controller";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ACTION, NETWORK_CONFIGS } from "./config";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const printControllerInitializeReservePayload = async () => {
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
  const vaultPda = getAssociatedTokenAddressSync(
    new web3.PublicKey(config.mint),
    new web3.PublicKey(controllerAuthority),
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const instruction = getInitializeReserveInstruction({
    payer: createNoopSigner(lzPayerSentinel),
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    authority: createNoopSigner(address(config.authority)),
    permission: permissionPda,
    reserve: reservePda,
    mint: address(config.mint),
    vault: address(vaultPda.toString()),
    tokenProgram: address(TOKEN_2022_PROGRAM_ID.toString()),
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

  writeOutputFile(args.file, payload);
};

printControllerInitializeReservePayload();
