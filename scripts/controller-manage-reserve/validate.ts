import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  readConfigFromFile,
  readArgs,
  readPayloadFile,
  simulatePayloadWithCompleteCrossChainFlow,
  validateSuccess,
} from "../../src";
import { address } from "@solana/kit";
import { ControllerManageReserveConfig, ACTION } from "./config";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveReservePda,
  getReserveCodec,
} from "@keel-fi/svm-alm-controller";

const main = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerManageReserveConfig>(args.config);
  const payload = readPayloadFile(config.outputFile);
  const payerPubkey = new web3.PublicKey(config.payer);
  const cpiAuthority = new web3.PublicKey(config.authority);

  const resp = await simulatePayloadWithCompleteCrossChainFlow(
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

  const reservePda = await deriveReservePda(
    address(config.controller),
    address(config.mint)
  );
  const reserveResp = resp[reservePda];
  assert(reserveResp.after, "Reserve should exist");
  assert.notDeepEqual(
    reserveResp.after.data,
    reserveResp.before.data,
    "Reserve data should change"
  );

  // Validate reserve data matches config (only validate non-null fields)
  const reserveCodec = getReserveCodec();
  const [reserve] = reserveCodec.read(reserveResp.after.data, 1);
  
  if (config.status !== null) {
    assert.equal(
      reserve.status,
      config.status,
      "Reserve status should match config"
    );
  }
  if (config.rateLimitSlope !== null) {
    assert.equal(
      reserve.rateLimitSlope,
      config.rateLimitSlope,
      "Reserve rateLimitSlope should match config"
    );
  }
  if (config.rateLimitMaxOutflow !== null) {
    assert.equal(
      reserve.rateLimitMaxOutflow,
      config.rateLimitMaxOutflow,
      "Reserve rateLimitMaxOutflow should match config"
    );
  }

  validateSuccess(config.outputFile);
};

main();

