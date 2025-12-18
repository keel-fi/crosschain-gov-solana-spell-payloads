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
  ReserveStatus,
} from "@keel-fi/svm-alm-controller";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ACTION, NETWORK_CONFIGS } from "./config";
import { derivePermissionPda, deriveControllerAuthorityPda } from "../../src";

// Derive associated token account address
const deriveAssociatedTokenAddress = (
  owner: Address<string>,
  mint: Address<string>
): Address<string> => {
  const ata = getAssociatedTokenAddressSync(
    new web3.PublicKey(mint),
    new web3.PublicKey(owner)
  );
  return fromLegacyPublicKey(ata);
};

const printControllerInitializeReservePayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
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
  const reservePda = await deriveReservePda(
    address(config.controller),
    address(config.mint)
  );
  const vaultPda = deriveAssociatedTokenAddress(
    reservePda,
    address(config.mint)
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
    vault: vaultPda,
    associatedTokenProgram: address("TODO: update to actual associated token program"),
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
