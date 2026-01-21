import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertContainsIn,
  assertInitializeIntegrationCommonAccountChanges,
  assertIntegrationCreated,
  validateCommonIntegrationFields,
  readConfigFromFile,
  readArgs,
  readPayloadFile,
  simulatePayloadWithCompleteCrossChainFlow,
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

  const { accountStates: resp, payer: simulationPayer } = await simulatePayloadWithCompleteCrossChainFlow(
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

  // Validate kamino accounts exist
  const obligationResp = resp[obligation.toString()];
  assert(obligationResp, "Obligation account should be in simulation response");
  assert(obligationResp.after, "Obligation account should exist");

  // Validate obligation account is owned by Kamino Lend program
  assert.equal(
    obligationResp.after.owner.toString(),
    kamino.KAMINO_LEND_PROGRAM_ID.toString(),
    "Obligation account should be owned by Kamino Lend program"
  );

  const reserveFarmCollateralResp = resp[config.reserveFarmCollateral];
  assert(
    reserveFarmCollateralResp,
    "Reserve farm collateral account should be in simulation response"
  );
  assert(
    reserveFarmCollateralResp.after,
    "Reserve farm collateral account should exist"
  );

  // Validate reserve farm collateral account is owned by Kamino Farm program
  assert.equal(
    reserveFarmCollateralResp.after.owner.toString(),
    kamino.KAMINO_FARMS_PROGRAM_ID.toString(),
    "Reserve farm collateral account should be owned by Kamino Farm program"
  );

  // Validate market account exists and is owned by Kamino Lend program
  const marketResp = resp[config.market];
  assert(marketResp, "Market account should be in simulation response");
  assert(marketResp.after, "Market account should exist");
  assert.equal(
    marketResp.after.owner.toString(),
    kamino.KAMINO_LEND_PROGRAM_ID.toString(),
    "Market account should be owned by Kamino Lend program"
  );

  // Validate reserve account exists and is owned by Kamino Lend program
  const reserveResp = resp[config.reserve];
  assert(reserveResp, "Reserve account should be in simulation response");
  assert(reserveResp.after, "Reserve account should exist");
  assert.equal(
    reserveResp.after.owner.toString(),
    kamino.KAMINO_LEND_PROGRAM_ID.toString(),
    "Reserve account should be owned by Kamino Lend program"
  );

  // Validate reserve liquidity mint account exists
  const reserveLiquidityMintResp = resp[config.reserveLiquidityMint];
  assert(reserveLiquidityMintResp, "Reserve liquidity mint account should be in simulation response");
  assert(reserveLiquidityMintResp.after, "Reserve liquidity mint account should exist");

  // Note: External read-only account change assertions skipped in surfpool mode
  // as accounts may erroneously become null

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
  // Use the actual payer from simulation (it generates a new keypair)
  assertInitializeIntegrationCommonAccountChanges(resp, {
    payer: simulationPayer.toString(),
    controller: config.controller,
    authority: config.authority,
    controllerProgramId: config.controllerProgramId,
    controllerAuthority,
    permissionPda,
    integrationPda: integrationPda.toString(),
    expectedHash: integrationHash,
    skipSurfpoolChecks: true,
  });

  // Assert integration is created
  assertIntegrationCreated(resp, integrationPda);

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const integrationResp = resp[integrationPda];
  const [integration] = integrationCodec.read(integrationResp.after!.data, 1);

  // Validate integration-level fields
  validateCommonIntegrationFields(integration, config);

  // Validate Kamino config fields
  if (integration.config.__kind !== "Kamino") {
    throw new Error("Expected Kamino config");
  }
  const actualKaminoConfig = integration.config.fields[0];
  assert(actualKaminoConfig, "Kamino config should exist");

  // Validate Kamino config fields including padding
  const expectedKaminoConfig: Omit<typeof actualKaminoConfig, never> = {
    market: address(config.market),
    reserve: address(config.reserve),
    reserveLiquidityMint: address(config.reserveLiquidityMint),
    obligation: address(obligation),
    obligationId: config.obligationId,
    padding: Buffer.from(new Uint8Array(95)),
  };
  assertContainsIn(expectedKaminoConfig, actualKaminoConfig);

  if (integration.state.__kind !== "Kamino") {
    throw new Error("Expected Kamino state");
  }
  const actualKaminoState = integration.state.fields[0];

  // Validate Kamino state fields including padding
  const expectedKaminoState: Omit<typeof actualKaminoState, never> = {
    balance: 0n,
    padding: Buffer.from(new Uint8Array(40)),
  };
  assertContainsIn(expectedKaminoState, actualKaminoState);

  validateSuccess(args.file);
};

main();
