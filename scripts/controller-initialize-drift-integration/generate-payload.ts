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
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getInitializeIntegrationInstruction,
  IntegrationType,
  initializeArgs,
  integrationConfig,
  getDriftConfigEncoder,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
} from "@keel-fi/svm-alm-controller";
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

  // Create drift config
  const driftConfigEncoder = getDriftConfigEncoder();
  const driftConfig = {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
    poolId: config.poolId,
    padding: new Uint8Array(32), // 32 bytes padding
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

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeDriftIntegrationPayload();

