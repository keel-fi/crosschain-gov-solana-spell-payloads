// Generates a payload for managing a Drift Integration account

import {
  convertKitInstructionToWeb3Js,
  readConfigFromFile,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import {
  deriveIntegrationPda,
  integrationConfig,
  computeIntegrationHash,
  createManageIntegrationInstruction,
} from "@keel-fi/svm-alm-controller";
import { ACTION, ControllerManageDriftIntegrationConfig } from "./config";

const printControllerManageDriftIntegrationPayload = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerManageDriftIntegrationConfig>(
    args.config
  );

  // Compute integration hash to derive integration PDA
  const driftConfig = {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
    poolId: config.poolId,
    padding: new Uint8Array(219),
  };
  const integrationConfigData = integrationConfig("Drift", [driftConfig]);
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

  const instruction = await createManageIntegrationInstruction(
    address(config.controller),
    createNoopSigner(address(config.authority)),
    integrationPda,
    config.status,
    config.rateLimitSlope,
    config.rateLimitMaxOutflow,
    descriptionBytes
  );

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(config.outputFile, payload);
};

printControllerManageDriftIntegrationPayload();
