import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
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

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
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
  const [controller] = controllerCodec.read(controllerResp.after.data, 1);
  assert.equal(
    controller.status,
    config.status,
    "Controller status should match config"
  );

  validateSuccess(args.file);
};

main();

