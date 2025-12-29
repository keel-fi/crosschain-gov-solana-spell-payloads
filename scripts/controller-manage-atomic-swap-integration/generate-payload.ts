// Generates a payload for managing an Atomic Swap Integration account

import {
  convertKitInstructionToWeb3Js,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import {
  getManageIntegrationInstruction,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  integrationConfig,
  computeIntegrationHash,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printControllerManageAtomicSwapIntegrationPayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );

  // Compute integration hash to derive integration PDA
  const expiryTimestamp = config.expiryTimestamp;
  const atomicSwapConfig = {
    inputToken: address(config.inputTokenMint),
    outputToken: address(config.outputTokenMint),
    oracle: address(config.oracle),
    maxStaleness: config.maxStaleness,
    expiryTimestamp,
    maxSlippageBps: config.maxSlippageBps,
    inputMintDecimals: config.inputMintDecimals,
    outputMintDecimals: config.outputMintDecimals,
    oraclePriceInverted: config.oraclePriceInverted,
    padding: new Uint8Array(107),
  };
  const integrationConfigData = integrationConfig("AtomicSwap", [
    atomicSwapConfig,
  ]);
  const integrationHash = computeIntegrationHash(integrationConfigData);
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash
  );

  // Convert description to bytes if provided
  let descriptionBytes: Uint8Array | null = null;
  if (config.description) {
    const encoded = new TextEncoder().encode(config.description);
    if (encoded.length > 32) {
      throw new Error("Description is too long. Must be 32 bytes or less.");
    }
    descriptionBytes = encoded;
  }

  const instruction = getManageIntegrationInstruction({
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    authority: createNoopSigner(address(config.authority)),
    permission: permissionPda,
    integration: integrationPda,
    programId: address(config.controllerProgramId),
    status: config.status,
    description: descriptionBytes,
    rateLimitSlope: config.rateLimitSlope,
    rateLimitMaxOutflow: config.rateLimitMaxOutflow,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerManageAtomicSwapIntegrationPayload();

