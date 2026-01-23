import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertContainsIn,
  assertInitializeIntegrationCommonAccountChanges,
  assertIntegrationCreated,
  assertNoAccountChanges,
  validateCommonIntegrationFields,
  convertLzSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readConfigFromFile,
  readArgs,
  readPayloadFile,
  simulateInstructions,
  validateSuccess,
  SURFPOOL_URL,
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
  drift,
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
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const payload = readPayloadFile(config.outputFile);

  const payerPubkey = new web3.PublicKey(config.payer);
  const instruction = convertLzSolanaGovernancePayloadToInstruction(
    payload,
    new web3.PublicKey(config.controllerProgramId),
    new web3.PublicKey(config.authority),
    payerPubkey
  );

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );

  // Derive drift_user account
  const driftUserPda = await drift.deriveUserPda(
    address(controllerAuthority),
    config.subAccountId
  );

  // Validate drift_user account exists
  const driftUserResp = resp[driftUserPda.toString()];
  assert(
    driftUserResp,
    "Drift user account should be in simulation response"
  );
  assert(
    driftUserResp.after,
    "Drift user account should exist"
  );

  // Validate drift_user account is owned by drift program
  assert.equal(
    driftUserResp.after.owner.toString(),
    drift.DRIFT_PROGRAM_ID.toString(),
    "Drift user account should be owned by drift program"
  );

  // Derive spot market PDA for the expected spot market index
  const spotMarketPda = await drift.deriveSpotMarketPda(
    config.spotMarketIndex
  );

  // Validate spot market account exists in simulation response
  const spotMarketResp = resp[spotMarketPda.toString()];
  assert(
    spotMarketResp,
    "Spot market account should be in simulation response"
  );
  if (rpcUrl !== SURFPOOL_URL) {
    assert(
      spotMarketResp.after,
      "Spot market account should exist"
    );

    // Validate spot market account is owned by drift program
    assert.equal(
      spotMarketResp.after.owner.toString(),
      drift.DRIFT_PROGRAM_ID.toString(),
      "Spot market account should be owned by drift program"
    );

    // Assert spot market does not change
    assertNoAccountChanges(spotMarketResp.before, spotMarketResp.after);
  }

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

  // Assert common account changes
  assertInitializeIntegrationCommonAccountChanges(resp, {
    payer: config.payer,
    controller: config.controller,
    authority: config.authority,
    controllerProgramId: config.controllerProgramId,
    controllerAuthority,
    permissionPda,
    integrationPda: integrationPda.toString(),
    expectedHash: integrationHash,
    skipSurfpoolChecks: rpcUrl === SURFPOOL_URL,
  });

  // Assert integration is created
  assertIntegrationCreated(resp, integrationPda);

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const integrationResp = resp[integrationPda];
  const [integration] = integrationCodec.read(integrationResp.after!.data, 1);

  // Validate integration-level fields
  validateCommonIntegrationFields(integration, config);

  // Validate Drift config fields
  if (integration.config.__kind !== "Drift") {
    throw new Error("Expected Drift config");
  }
  const actualDriftConfig = integration.config.fields[0];
  assert(actualDriftConfig, "Drift config should exist");

  // Validate Drift config fields including padding
  const expectedDriftConfig: Omit<typeof actualDriftConfig, never> = {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
    poolId: config.poolId,
    padding: Buffer.from(new Uint8Array(219)),
  };
  assertContainsIn(expectedDriftConfig, actualDriftConfig);

  if (integration.state.__kind !== "Drift") {
    throw new Error("Expected Drift state");
  }

  const actualDriftState = integration.state.fields[0];

  // Validate Drift state fields including padding
  const expectedDriftState: Omit<typeof actualDriftState, never> = {
    balance: 0n,
    padding: Buffer.from(new Uint8Array(40)),
  };
  assertContainsIn(expectedDriftState, actualDriftState);

  validateSuccess(args.file);
};

main();
