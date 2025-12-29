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
  deriveReservePda,
  getReserveCodec,
} from "@keel-fi/svm-alm-controller";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

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

  validateSuccess(args.file);
};

main();
