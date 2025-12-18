// Generates a payload for initializing a Kamino Integration account

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
  getInitializeIntegrationInstruction,
  IntegrationType,
  initializeArgs,
  getIntegrationConfigEncoder,
  integrationConfig,
  getKaminoConfigEncoder,
} from "@keel-fi/svm-alm-controller";
import { createHash } from "crypto";
import { ACTION, NETWORK_CONFIGS } from "./config";
import { derivePermissionPda, deriveControllerAuthorityPda, deriveIntegrationPda } from "../../src";

// Compute integration hash from integration type and config
const computeIntegrationHash = (
  integrationType: IntegrationType,
  config: any
): Uint8Array => {
  const configEncoder = getIntegrationConfigEncoder();
  const encodedConfig = configEncoder.encode(config);
  const hash = createHash("sha256")
    .update(Buffer.from([integrationType]))
    .update(encodedConfig)
    .digest();
  return new Uint8Array(hash);
};

const printControllerInitializeKaminoIntegrationPayload = async () => {
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

  // Create kamino config
  const kaminoConfig = {
    market: address(config.market),
    reserve: address(config.reserve),
    reserveLiquidityMint: address(config.reserveLiquidityMint),
    obligation: address(config.obligation),
    obligationId: config.obligationId,
    padding: new Uint8Array(32), // 32 bytes padding
  };
  const integrationConfigData = integrationConfig("Kamino", [kaminoConfig]);
  
  // Compute integration hash
  const integrationHash = computeIntegrationHash(
    IntegrationType.Kamino,
    integrationConfigData
  );
  
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash,
    address(config.controllerProgramId)
  );
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const innerArgs = initializeArgs("KaminoIntegration", {
    obligationId: config.obligationId,
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
    integrationType: IntegrationType.Kamino,
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

printControllerInitializeKaminoIntegrationPayload();

