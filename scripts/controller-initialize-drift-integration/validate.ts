import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertInitializeIntegrationCommonAccountChanges,
  assertIntegrationCreated,
  validateCommonIntegrationFields,
  readConfigFromFile,
  readArgs,
  readPayloadFile,
  simulateControllerPayloadWithLayerZeroForValidation,
  validateSuccess,
} from "../../src";
import { address } from "@solana/kit";
import { ACTION, ControllerInitializeDriftIntegrationConfig } from "./config";
import {
  getIntegrationCodec,
  integrationConfig,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  computeIntegrationHash,
} from "@keel-fi/svm-alm-controller";

// In this script we validate that state and configuration
// was correctly set in the SVM ALM Controller program.
// The different accounts and args passed to the initialize integration instruction
// (mint, spot market index) have been manually validated. Links to their respective
// sources have been added in the constants.ts file.
const main = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerInitializeDriftIntegrationConfig>(args.config);
  const payload = readPayloadFile(config.outputFile);
  const payerPubkey = new web3.PublicKey(config.payer);
  const cpiAuthority = new web3.PublicKey(config.authority);

  const resp = await simulateControllerPayloadWithLayerZeroForValidation(
    payload,
    new web3.PublicKey(config.controllerProgramId),
    payerPubkey,
    cpiAuthority,
    1n // nonce
  );

  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );

  // Compute integration hash
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

  console.log("integrationPda", integrationPda.toString());

  // Assert common account changes
  assertInitializeIntegrationCommonAccountChanges(resp, {
    payer: config.payer,
    controller: config.controller,
    authority: config.authority,
    controllerProgramId: config.controllerProgramId,
    controllerAuthority,
    permissionPda,
  });

  // Assert integration is created
  assertIntegrationCreated(resp, integrationPda);

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const integrationResp = resp[integrationPda];
  const [integration] = integrationCodec.read(integrationResp.after!.data, 1);
  assert.equal(integration.config.__kind, "Drift");

  // Validate integration-level fields
  validateCommonIntegrationFields(integration, config);

  // Validate Drift config fields
  if (integration.config.__kind !== "Drift") {
    throw new Error("Expected Drift config");
  }
  const actualDriftConfig = integration.config.fields[0];
  assert(actualDriftConfig, "Drift config should exist");

  assert.equal(
    actualDriftConfig.subAccountId,
    config.subAccountId,
    "Sub account ID should match config"
  );
  assert.equal(
    actualDriftConfig.spotMarketIndex,
    config.spotMarketIndex,
    "Spot market index should match config"
  );
  assert.equal(
    actualDriftConfig.poolId,
    config.poolId,
    "Pool ID should match config"
  );

  if (integration.state.__kind !== "Drift") {
    throw new Error("Expected Drift state");
  }

  const actualDriftState = integration.state.fields[0];

  assert.equal(
    actualDriftState.balance.toString(),
    "0",
    "Integration state balance should be 0"
  );

  validateSuccess(args.file);
};

main();
