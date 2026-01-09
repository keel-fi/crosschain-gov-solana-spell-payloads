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
import { ACTION, ControllerInitializeKaminoIntegrationConfig } from "./config";
import {
  getIntegrationCodec,
  integrationConfig,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  kamino,
  computeIntegrationHash,
} from "@keel-fi/svm-alm-controller";

// In this script we validate that state and configuration 
// was correctly set in the SVM ALM Controller program.
// The different accounts passed to the initialize integration instruction 
// (mint, kamino market, kamino reserve, reserve farm collateral)
// have been manually validated. Links to their respective 
// sources have been added in the constants.ts file.
const main = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerInitializeKaminoIntegrationConfig>(args.config);
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
    address(config.authority),
  );

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
  );
  const obligation = await kamino.deriveVanillaObligationAddress(
    config.obligationId,
    address(controllerAuthority),
    address(config.market)
  );

  // Compute integration hash
  const kaminoConfig = {
    market: address(config.market),
    reserve: address(config.reserve),
    reserveLiquidityMint: address(config.reserveLiquidityMint),
    obligation: address(obligation),
    obligationId: config.obligationId,
    padding: new Uint8Array(95),
  };
  const integrationConfigData = integrationConfig("Kamino", [kaminoConfig]);
  const integrationHash = computeIntegrationHash(
    integrationConfigData
  );
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash,
  );

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
  assert.equal(integration.config.__kind, "Kamino");

  // Validate integration-level fields
  validateCommonIntegrationFields(integration, config);

  // Validate Kamino config fields
  if (integration.config.__kind !== "Kamino") {
    throw new Error("Expected Kamino config");
  }
  const actualKaminoConfig = integration.config.fields[0];
  assert(actualKaminoConfig, "Kamino config should exist");
  
  assert.equal(
    actualKaminoConfig.obligationId,
    config.obligationId,
    "Obligation ID should match config"
  );
  assert.equal(
    actualKaminoConfig.market.toString(),
    address(config.market).toString(),
    "Market should match config"
  );
  assert.equal(
    actualKaminoConfig.reserve.toString(),
    address(config.reserve).toString(),
    "Reserve should match config"
  );
  assert.equal(
    actualKaminoConfig.reserveLiquidityMint.toString(),
    address(config.reserveLiquidityMint).toString(),
    "Reserve liquidity mint should match config"
  );
  assert.equal(
    actualKaminoConfig.obligation.toString(),
    address(obligation).toString(),
    "Obligation should match config"
  );

  if (integration.state.__kind !== "Kamino") {
    throw new Error("Expected Kamino state");
  }
  const actualKaminoState = integration.state.fields[0];
  
  assert.equal(
    actualKaminoState.balance.toString(),
    "0",
    "Integration state balance should be 0"
  );

  validateSuccess(args.file);
};

main();
