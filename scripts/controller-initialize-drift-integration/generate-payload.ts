// Generates a payload for initializing a Drift Integration account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
  computeIntegrationHash,
} from "../../src";
import { address, createNoopSigner, AccountRole } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getInitializeIntegrationInstruction,
  IntegrationType,
  initializeArgs,
  integrationConfig,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
} from "@keel-fi/svm-alm-controller";
import { drift } from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printControllerInitializeDriftIntegrationPayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority),
  );

  // Derive Drift PDAs
  // Convert controllerAuthority to string for PDA derivation
  const userStatsPda = await drift.deriveUserStatsPda(address(controllerAuthority));
  const userPda = await drift.deriveUserPda(
    address(controllerAuthority),
    config.subAccountId
  );
  const statePda = await drift.deriveStatePda();
  const spotMarketPda = await drift.deriveSpotMarketPda(
    config.spotMarketIndex
  );

  const driftConfig = {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
    poolId: config.poolId,
    padding: new Uint8Array(219),
  };
  const integrationConfigData = integrationConfig("Drift", [driftConfig]);
  
  // Compute integration hash
  const integrationHash = computeIntegrationHash(
    IntegrationType.Drift,
    integrationConfigData
  );
  
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash,
  );
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const innerArgs = initializeArgs("Drift", {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
  });

  const instruction = getInitializeIntegrationInstruction({
    payer: createNoopSigner(lzPayerSentinel),
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    authority: createNoopSigner(address(config.authority)),
    permission: permissionPda,
    integration: integrationPda,
    programId: address(config.controllerProgramId),
    systemProgram: fromLegacyPublicKey(web3.SystemProgram.programId),
    integrationType: IntegrationType.Drift,
    status: config.status,
    description: Buffer.from(config.description, "utf-8"),
    rateLimitSlope: config.rateLimitSlope,
    rateLimitMaxOutflow: config.rateLimitMaxOutflow,
    permitLiquidation: config.permitLiquidation,
    innerArgs: innerArgs,
  });

  // Add remaining accounts for Drift integration
  // 1. Mint (readonly)
  instruction.accounts.push({
    address: address(config.mint),
    role: AccountRole.READONLY,
  });

  // 2. User PDA (writable)
  instruction.accounts.push({
    address: address(userPda.toString()),
    role: AccountRole.WRITABLE,
  });

  // 3. User Stats PDA (writable)
  instruction.accounts.push({
    address: address(userStatsPda.toString()),
    role: AccountRole.WRITABLE,
  });

  // 4. State PDA (writable)
  instruction.accounts.push({
    address: address(statePda.toString()),
    role: AccountRole.WRITABLE,
  });

  // 5. Spot Market PDA (readonly)
  instruction.accounts.push({
    address: address(spotMarketPda.toString()),
    role: AccountRole.READONLY,
  });

  // 6. Rent sysvar (readonly)
  instruction.accounts.push({
    address: address(web3.SYSVAR_RENT_PUBKEY.toString()),
    role: AccountRole.READONLY,
  });

  // 7. Drift Program ID (readonly)
  instruction.accounts.push({
    address: address(drift.DRIFT_PROGRAM_ID),
    role: AccountRole.READONLY,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeDriftIntegrationPayload();

