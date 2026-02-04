import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  readConfigFromFile,
  readArgs,
  simulatePayloadWithCompleteCrossChainFlow,
  validateSuccess,
  bytesToUtf8TrimNull,
  assertContainsIn,
  readPayloadOrDecodePacket,
} from "../../src";
import { address } from "@solana/kit";
import { ControllerManageIntegrationConfig, ACTION } from "./config";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  getIntegrationCodec,
} from "@keel-fi/svm-alm-controller";

export const validateManageIntegration = async (
  config: ControllerManageIntegrationConfig,
  packetBytes: string | undefined,
) => {
  const payload = readPayloadOrDecodePacket({
    file: packetBytes ? undefined : config.outputFile,
    packetBytes,
  });

  const payerPubkey = new web3.PublicKey(config.payer);
  const cpiAuthority = new web3.PublicKey(config.authority);

  const { accountStates: resp, payer: simulationPayer } =
    await simulatePayloadWithCompleteCrossChainFlow(
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

  // Assert payer does not change, except for lamports
  // Use the actual payer from simulation (it generates a new keypair)
  const payerResp = resp[simulationPayer.toString()];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  assertNoAccountChanges(controllerResp.before, controllerResp.after);

  // Assert controller authority does not change
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const controllerAuthorityResp = resp[controllerAuthority];
  assertNoAccountChanges(
    controllerAuthorityResp?.before,
    controllerAuthorityResp?.after
  );

  // Assert authority does not change
  const authorityResp = resp[config.authority];
  assertNoAccountChanges(authorityResp.before, authorityResp.after);

  // Assert permission does not change
  const permissionResp = resp[permissionPda];
  if (permissionResp.before) {
    assertNoAccountChanges(permissionResp.before, permissionResp.after);
  }

  // Assert integration exists and changes
  const integrationResp = resp[config.integration];
  assert(integrationResp.before, "Integration should exist before");
  assert(integrationResp.after, "Integration should exist after");
  assert.notDeepEqual(
    integrationResp.after.data,
    integrationResp.before.data,
    "Integration data should change"
  );

  // Validate integration data matches config (only validate non-null fields)
  const integrationCodec = getIntegrationCodec();
  const [integrationAfter] = integrationCodec.read(
    integrationResp.after.data,
    1
  );
  const [integrationBefore] = integrationCodec.read(
    integrationResp.before.data,
    1
  );

  if (config.status !== null) {
    assert.equal(
      integrationAfter.status,
      config.status,
      "Status should match config"
    );
  }

  if (config.description !== null) {
    assert.equal(
      bytesToUtf8TrimNull(integrationAfter.description),
      config.description,
      "Description should match config"
    );
  }

  if (config.rateLimitSlope !== null) {
    assert.equal(
      integrationAfter.rateLimitSlope.toString(),
      config.rateLimitSlope.toString(),
      "Rate limit slope should match config"
    );
  } 

  if (config.rateLimitMaxOutflow !== null) {
    assert.equal(
      integrationAfter.rateLimitMaxOutflow.toString(),
      config.rateLimitMaxOutflow.toString(),
      "Rate limit max outflow should match config"
    );
  }

  const skipKeys = [
    ...Object.entries(config)
      .filter(([, value]) => value !== null)
      .map(([key]) => key),
    "rateLimitOutflowAmountAvailable", // Can change due to rate limiting calculations
    "lastRefreshTimestamp", // Can change over time
    "lastRefreshSlot", // Can change over time
  ];
  assertContainsIn(integrationBefore, integrationAfter, { skipKeys });

}

const main = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerManageIntegrationConfig>(
    args.config
  );

  // Support both file-based and Packet bytes-based payload reading
  const packetBytes = (args["packet-bytes"] || args.bytes) as string | undefined;
  
  await validateManageIntegration(config, packetBytes);

  validateSuccess(config.outputFile);
};

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
