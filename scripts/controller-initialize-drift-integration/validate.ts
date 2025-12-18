import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
  validateSuccess,
} from "../../src";
import { address } from "@solana/kit";
import {
  NETWORK_CONFIGS,
  ACTION,
} from "./config";
import {
  IntegrationType,
  getIntegrationCodec,
  getIntegrationConfigEncoder,
  integrationConfig,
  getDriftConfigEncoder,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
} from "@keel-fi/svm-alm-controller";
import { createHash } from "crypto";

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

const main = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);

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
    address(config.authority),
    address(config.controllerProgramId)
  );

  // Compute integration hash
  const driftConfig = {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
    poolId: config.poolId,
    padding: new Uint8Array(32), // 32 bytes padding
  };
  const integrationConfigData = integrationConfig("Drift", [driftConfig]);
  const integrationHash = computeIntegrationHash(
    IntegrationType.Drift,
    integrationConfigData
  );
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash,
    address(config.controllerProgramId)
  );

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  assertNoAccountChanges(controllerResp.before, controllerResp.after);

  // Assert controller authority does not change
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
    address(config.controllerProgramId)
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

  // Assert integration is created
  const integrationResp = resp[integrationPda];
  assert(integrationResp.after, "Integration should be created");
  if (integrationResp.before) {
    assert.notDeepEqual(
      integrationResp.after.data,
      integrationResp.before.data,
      "Integration data should change"
    );
  }

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const [integration] = integrationCodec.read(integrationResp.after.data, 1);
  assert.equal(integration.integrationType, IntegrationType.Drift);
  assert.equal(integration.status, config.status);

  validateSuccess(args.file);
};

main();

