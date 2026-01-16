import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulatePayloadWithCompleteCrossChainFlow,
  validateSuccess,
} from "../../src";
import {
  getControllerCodec,
  deriveControllerAuthorityPda,
  derivePermissionPda,
} from "@keel-fi/svm-alm-controller";
import { address } from "@solana/kit";
import { NETWORK_CONFIGS, ACTION } from "./config";

const main = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);
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

  // Assert payer does not change, except for lamports
  // Use the actual payer from simulation (it generates a new keypair)
  const payerResp = resp[simulationPayer.toString()];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

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

  // Assert controller changes
  const controllerResp = resp[config.controller];
  assert(controllerResp.after, "Controller should exist");
  assert.notDeepEqual(
    controllerResp.after.data,
    controllerResp.before.data,
    "Controller data should change"
  );

  // Validate controller data matches config
  const controllerCodec = getControllerCodec();
  const [controllerAfter] = controllerCodec.read(controllerResp.after.data, 1);
  const [controllerBefore] = controllerCodec.read(controllerResp.before.data, 1);
  assert.equal(
    controllerAfter.status,
    config.status,
    "Controller status should match config"
  );
  assert.equal(
    controllerBefore.authority.toString(),
    controllerAfter.authority.toString(),
    "Controller authority should match after"
  );
  assert.equal(
    controllerBefore.authorityBump,
    controllerAfter.authorityBump,
    "Controller authority bump should match after"
  );
  assert.equal(
    controllerBefore.bump,
    controllerAfter.bump,
    "Controller bump should match after"
  );
  assert.equal(
    controllerBefore.id,
    controllerAfter.id,
    "Controller id should match after"
  );
  assert.equal(
    controllerBefore.padding,
    controllerAfter.padding,
    "Controller padding should match after"
  );

  validateSuccess(args.file);
};

main();

