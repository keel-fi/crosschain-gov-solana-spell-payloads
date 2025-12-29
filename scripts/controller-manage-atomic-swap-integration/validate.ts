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
  bytesToUtf8TrimNull,
} from "../../src";
import { address } from "@solana/kit";
import { NETWORK_CONFIGS, ACTION } from "./config";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  getIntegrationCodec,
  integrationConfig,
  computeIntegrationHash,
} from "@keel-fi/svm-alm-controller";

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

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
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
  const integrationResp = resp[integrationPda];
  assert(integrationResp.after, "Integration should exist");
  assert.notDeepEqual(
    integrationResp.after.data,
    integrationResp.before.data,
    "Integration data should change"
  );

  // Validate integration data matches config (only validate non-null fields)
  const integrationCodec = getIntegrationCodec();
  const [integration] = integrationCodec.read(integrationResp.after.data, 1);
  
  if (config.status !== null) {
    assert.equal(integration.status, config.status, "Status should match config");
  }
  if (config.description !== null) {
    assert.equal(
      bytesToUtf8TrimNull(integration.description),
      config.description,
      "Description should match config"
    );
  }
  if (config.rateLimitSlope !== null) {
    assert.equal(
      integration.rateLimitSlope.toString(),
      config.rateLimitSlope.toString(),
      "Rate limit slope should match config"
    );
  }
  if (config.rateLimitMaxOutflow !== null) {
    assert.equal(
      integration.rateLimitMaxOutflow.toString(),
      config.rateLimitMaxOutflow.toString(),
      "Rate limit max outflow should match config"
    );
  }

  validateSuccess(args.file);
};

main();

