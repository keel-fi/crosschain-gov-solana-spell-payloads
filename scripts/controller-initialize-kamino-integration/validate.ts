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
import { PublicKey } from "@solana/web3.js";

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

  if (config.reserveFarmCollateral !== PublicKey.default.toString()) {
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
  }

  // Validate market account exists and is owned by Kamino Lend program
  const marketResp = resp[config.market];
  assert(marketResp, "Market account should be in simulation response");
  if (rpcUrl !== SURFPOOL_URL) {
    assert(marketResp.after, "Market account should exist");

    assert.equal(
      marketResp.after.owner.toString(),
      kamino.KAMINO_LEND_PROGRAM_ID.toString(),
      "Market account should be owned by Kamino Lend program"
    );
  }

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
  if (rpcUrl !== SURFPOOL_URL) {

    assert(reserveLiquidityMintResp.after, "Reserve liquidity mint account should exist");

    // Assert external read-only accounts do not change
    // Assert market does not change
    const marketResp = resp[config.market];
    assertNoAccountChanges(marketResp.before, marketResp.after);

    // Assert reserve does not change
    const reserveResp = resp[config.reserve];
    assertNoAccountChanges(reserveResp.before, reserveResp.after);

    // Assert reserve liquidity mint does not change
    assertNoAccountChanges(reserveLiquidityMintResp.before, reserveLiquidityMintResp.after);

    // Note: reserve farm collateral account will change as the number of users increases
    // when initializing a new integration, so we don't assert it remains unchanged

    // Assert referrer does not change
    const referrerResp = resp[config.referrer];
    assertNoAccountChanges(referrerResp.before, referrerResp.after);
  }

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
