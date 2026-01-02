// Generates a payload for managing a Kamino Integration account

import {
  convertKitInstructionToWeb3Js,
  readConfigFromFile,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import {
  address,
  createNoopSigner,
} from "@solana/kit";
import {
  getManageIntegrationInstruction,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  integrationConfig,
  computeIntegrationHash,
  kamino,
} from "@keel-fi/svm-alm-controller";
import { ACTION, ControllerManageKaminoIntegrationConfig } from "./config";

const printControllerManageKaminoIntegrationPayload = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerManageKaminoIntegrationConfig>(args.config);

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );
  const obligation = await kamino.deriveVanillaObligationAddress(
    config.obligationId,
    address(controllerAuthority),
    address(config.market)
  );

  // Compute integration hash to derive integration PDA
  const kaminoConfig = {
    market: address(config.market),
    reserve: address(config.reserve),
    reserveLiquidityMint: address(config.reserveLiquidityMint),
    obligation: address(obligation),
    obligationId: config.obligationId,
    reserveFarmCollateral: address(config.reserveFarmCollateral),
    referrer: address(config.referrer),
    padding: new Uint8Array(128),
  };
  const integrationConfigData = integrationConfig("Kamino", [kaminoConfig]);
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

  writeOutputFile(config.outputFile, payload);
};

printControllerManageKaminoIntegrationPayload();

