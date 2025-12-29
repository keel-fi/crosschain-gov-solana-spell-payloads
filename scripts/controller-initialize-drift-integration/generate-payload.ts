// Generates a payload for initializing a Drift Integration account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
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
  computeIntegrationHash,
  createDriftInitializeIntegrationInstruction,
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

  const instruction = await createDriftInitializeIntegrationInstruction(
    createNoopSigner(lzPayerSentinel),
    address(config.controller),
    createNoopSigner(address(config.authority)),
    address(config.mint),
    config.description,
    config.status,
    config.rateLimitSlope,
    config.rateLimitMaxOutflow,
    config.permitLiquidation,
    config.subAccountId,
    config.spotMarketIndex,
    config.poolId,
  );

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeDriftIntegrationPayload();

