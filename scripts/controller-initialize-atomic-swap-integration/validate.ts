import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  assertInitializeIntegrationCommonAccountChanges,
  assertIntegrationCreated,
  validateCommonIntegrationFields,
  readConfigFromFile,
  readArgs,
  readPayloadFile,
  simulatePayloadWithCompleteCrossChainFlow,
  validateSuccess,
  SURFPOOL_URL,
  getRpcEndpoint,
} from "../../src";
import { address } from "@solana/kit";
import {
  ACTION,
  ControllerInitializeAtomicSwapIntegrationConfig,
} from "./config";
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
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config =
    readConfigFromFile<ControllerInitializeAtomicSwapIntegrationConfig>(
      args.config
    );
  const expiryTimestamp = config.expiryTimestamp;
  
  const rpcUrl = getRpcEndpoint();
  const payload = readPayloadFile(config.outputFile);
  const payerPubkey = new web3.PublicKey(config.payer);
  const cpiAuthority = new web3.PublicKey(config.authority);

  const { accountStates: resp, payer: simulationPayer } = await simulatePayloadWithCompleteCrossChainFlow(
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

  // Assert common account changes
  // Use the actual payer from simulation (it generates a new keypair)
  assertInitializeIntegrationCommonAccountChanges(resp, {
    payer: simulationPayer.toString(),
    controller: config.controller,
    authority: config.authority,
    controllerProgramId: config.controllerProgramId,
    controllerAuthority,
    permissionPda,
    skipSurfpoolChecks: rpcUrl === SURFPOOL_URL,
  });

  // Assert input mint does not change
  const inputMintResp = resp[config.inputTokenMint];
  if (rpcUrl !== SURFPOOL_URL) {
    assertNoAccountChanges(inputMintResp.before, inputMintResp.after);
  }

  // Assert output mint does not change
  const outputMintResp = resp[config.outputTokenMint];
  if (rpcUrl !== SURFPOOL_URL) {
    assertNoAccountChanges(outputMintResp.before, outputMintResp.after);
  }

  // Assert oracle does not change
  const oracleResp = resp[config.oracle];
  if (rpcUrl !== SURFPOOL_URL) {
    assertNoAccountChanges(oracleResp.before, oracleResp.after);
  }

  // Assert integration is created
  assertIntegrationCreated(resp, integrationPda);

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const integrationResp = resp[integrationPda];
  const [integration] = integrationCodec.read(integrationResp.after!.data, 1);

  // Validate integration-level fields
  assert.equal(
    integration.config.__kind,
    "AtomicSwap",
    "Config kind should be AtomicSwap"
  );
  validateCommonIntegrationFields(integration, config);

  // Validate integration state exists
  assert(integration.state, "Integration state should exist");
  assert.equal(
    integration.state.__kind,
    "AtomicSwap",
    "State kind should be AtomicSwap"
  );

  if (integration.state.__kind !== "AtomicSwap") {
    throw new Error("Expected AtomicSwap state");
  }

  assert.equal(
    integration.state.fields[0].amountBorrowed.toString(),
    "0",
    "Amount borrowed should be 0"
  );
  assert.equal(
    integration.state.fields[0].lastBalanceA.toString(),
    "0",
    "Amount borrowed should be 0"
  );
  assert.equal(
    integration.state.fields[0].lastBalanceB.toString(),
    "0",
    "Last balance B should be 0"
  );
  const expectedPadding = new Uint8Array(8);
  const actualPadding = integration.state.fields[0].padding;
  assert.equal(actualPadding.length, 8, "Padding should be 8 bytes");
  assert.deepStrictEqual(
    Array.from(actualPadding),
    Array.from(expectedPadding),
    "Padding should be all zeros"
  );
  assert.equal(
    integration.state.fields[0].recipientTokenAPre.toString(),
    "0",
    "Recipient token A pre should be 0"
  );
  assert.equal(
    integration.state.fields[0].recipientTokenBPre.toString(),
    "0",
    "Recipient token A post should be 0"
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
