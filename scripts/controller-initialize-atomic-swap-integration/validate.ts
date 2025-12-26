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
  const args = readArgs(ACTION);
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const expiryTimestamp = config.expiryTimestamp;
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
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

  const expectedAtomicSwapConfig = {
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
    expectedAtomicSwapConfig,
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
  if (controllerResp?.before && controllerResp?.after) {
    assertNoAccountChanges(controllerResp.before, controllerResp.after);
  }

  // Assert controller authority does not change
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const controllerAuthorityResp = resp[controllerAuthority];
  assertNoAccountChanges(
    controllerAuthorityResp.before,
    controllerAuthorityResp.after
  );

  // Assert authority does not change
  const authorityResp = resp[config.authority];
  assertNoAccountChanges(authorityResp.before, authorityResp.after);

  // Assert permission does not change
  const permissionResp = resp[permissionPda];
  assertNoAccountChanges(permissionResp.before, permissionResp.after);

  // Assert controller program does not change
  const controllerProgramResp = resp[config.controllerProgramId];
  assertNoAccountChanges(
    controllerProgramResp.before,
    controllerProgramResp.after
  );

  // Assert input mint does not change
  const inputMintResp = resp[config.inputTokenMint];
  assertNoAccountChanges(inputMintResp.before, inputMintResp.after);

  // Assert output mint does not change
  const outputMintResp = resp[config.outputTokenMint];
  assertNoAccountChanges(outputMintResp.before, outputMintResp.after);

  // Assert oracle does not change
  const oracleResp = resp[config.oracle];
  assertNoAccountChanges(oracleResp.before, oracleResp.after);

  // Assert integration is created
  const integrationResp = resp[integrationPda];
  assert(integrationResp.after, "Integration should be created");
  assert.notDeepEqual(
    integrationResp.after.data,
    integrationResp.before.data,
    "Integration data should change"
  );

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const [integration] = integrationCodec.read(integrationResp.after.data, 1);
  
  // Validate integration-level fields
  assert.equal(integration.config.__kind, "AtomicSwap", "Config kind should be AtomicSwap");
  assert.equal(integration.status, config.status, "Status should match config");
  assert.equal(
    integration.description.toString(),
    config.description,
    "Description should match config"
  );
  assert.equal(
    integration.rateLimitSlope.toString(),
    config.rateLimitSlope.toString(),
    "Rate limit slope should match config"
  );
  assert.equal(
    integration.rateLimitMaxOutflow.toString(),
    config.rateLimitMaxOutflow.toString(),
    "Rate limit max outflow should match config"
  );
  assert.equal(
    integration.permitLiquidation,
    config.permitLiquidation,
    "Permit liquidation should match config"
  );
  
  
  // Validate integration state exists
  assert(integration.state, "Integration state should exist");
  assert.equal(
    integration.state.__kind,
    "AtomicSwap",
    "State kind should be AtomicSwap"
  );

  // Validate AtomicSwap config fields
  if (integration.config.__kind !== "AtomicSwap") {
    throw new Error("Expected AtomicSwap config");
  }
  const actualAtomicSwapConfig = integration.config.fields[0];
  assert(actualAtomicSwapConfig, "AtomicSwap config should exist");

  assert.equal(
    actualAtomicSwapConfig.maxSlippageBps,
    config.maxSlippageBps,
    "Max slippage BPS should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.maxStaleness.toString(),
    config.maxStaleness.toString(),
    "Max staleness should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.expiryTimestamp.toString(),
    expiryTimestamp.toString(),
    "Expiry timestamp should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.oraclePriceInverted,
    config.oraclePriceInverted,
    "Oracle price inverted should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.inputToken.toString(),
    address(config.inputTokenMint).toString(),
    "Input token should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.outputToken.toString(),
    address(config.outputTokenMint).toString(),
    "Output token should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.oracle.toString(),
    address(config.oracle).toString(),
    "Oracle should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.inputMintDecimals,
    config.inputMintDecimals,
    "Input mint decimals should match config"
  );
  assert.equal(
    actualAtomicSwapConfig.outputMintDecimals,
    config.outputMintDecimals,
    "Output mint decimals should match config"
  );

  validateSuccess(args.file);
};

main();
