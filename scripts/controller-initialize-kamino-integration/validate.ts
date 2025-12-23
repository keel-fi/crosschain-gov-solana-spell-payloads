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
  computeIntegrationHash,
} from "../../src";
import { address } from "@solana/kit";
import {
  NETWORK_CONFIGS,
  ACTION,
} from "./config";
import {
  IntegrationType,
  getIntegrationCodec,
  integrationConfig,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  kamino,
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

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  assertNoAccountChanges(controllerResp.before, controllerResp.after);

  // Assert controller authority does not change
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
  assert.equal(integration.config.__kind, "Kamino");
  assert.equal(integration.status, config.status);
  
  // Validate integration-level fields
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

  validateSuccess(args.file);
};

main();
