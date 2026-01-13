import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  readConfigFromFile,
  readArgs,
  readPayloadFile,
  simulatePayloadWithCompleteCrossChainFlow,
  validateSuccess,
  SURFPOOL_URL,
} from "../../src";
import { address } from "@solana/kit";
import { ACTION, ControllerInitializeReserveConfig } from "./config";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveReservePda,
  getReserveCodec,
} from "@keel-fi/svm-alm-controller";
import {
  getAssociatedTokenAddressSync,
  unpackAccount,
} from "@solana/spl-token";

const main = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerInitializeReserveConfig>(
    args.config
  );

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

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  if (rpcUrl !== SURFPOOL_URL) {
    assertNoAccountChanges(controllerResp.before, controllerResp.after);
  }

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
  if (rpcUrl !== SURFPOOL_URL) {
    assertNoAccountChanges(permissionResp.before, permissionResp.after);
  }

  const reservePda = await deriveReservePda(
    address(config.controller),
    address(config.mint)
  );
  const reserveResp = resp[reservePda];
  assert(reserveResp.after, "Reserve should be created");

  // Validate reserve account ownership
  assert.equal(
    reserveResp.after.owner.toString(),
    config.controllerProgramId.toString(),
    "Reserve should be owned by controller program"
  );

  // Validate reserve data matches config
  const reserveCodec = getReserveCodec();
  const [reserve] = reserveCodec.read(reserveResp.after.data, 1);

  assert.equal(
    reserve.controller.toString(),
    config.controller.toString(),
    "Reserve controller should match config"
  );

  assert.equal(
    reserve.mint.toString(),
    config.mint.toString(),
    "Mint should match config"
  );
  assert.equal(
    reserve.status,
    config.status,
    "Reserve status should match config"
  );

  // Validate rate limit fields
  assert.equal(
    reserve.rateLimitSlope,
    config.rateLimitSlope,
    "Reserve rateLimitSlope should match config"
  );
  assert.equal(
    reserve.rateLimitMaxOutflow,
    config.rateLimitMaxOutflow,
    "Reserve rateLimitMaxOutflow should match config"
  );

  // Validate rate limit initial state
  assert.equal(
    reserve.rateLimitOutflowAmountAvailable.toString(),
    config.rateLimitMaxOutflow.toString(),
    "Rate limit outflow amount available should match max outflow initially"
  );
  assert.equal(
    reserve.rateLimitRemainder.toString(),
    "0",
    "Rate limit remainder should be 0 initially"
  );

  // Validate vault account is created
  const vaultPda = getAssociatedTokenAddressSync(
    new web3.PublicKey(config.mint),
    new web3.PublicKey(controllerAuthority),
    true,
    new web3.PublicKey(config.tokenProgram)
  );
  const vaultResp = resp[vaultPda.toString()];
  assert(vaultResp, "Vault account should be in simulation response");
  assert(vaultResp.after, "Vault should be created");

  // Validate vault account ownership
  assert.equal(
    vaultResp.after.owner.toString(),
    config.tokenProgram,
    "Vault should be owned by token program"
  );

  // Unpack token account and assert owner is Controller Authority
  const tokenAccount = unpackAccount(
    vaultPda,
    vaultResp.after,
    new web3.PublicKey(config.tokenProgram)
  );
  assert.equal(
    tokenAccount.owner.toString(),
    controllerAuthority.toString(),
    "Token account owner should be Controller Authority"
  );

  validateSuccess(args.file);
};

main();
