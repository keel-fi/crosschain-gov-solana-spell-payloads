import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzGovernanceSolanaPayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
} from "../../src";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  getPermissionCodec,
} from "@keel-fi/svm-alm-controller";
import { address } from "@solana/kit";
import { NETWORK_CONFIGS, PERMISSIONS as EXPECTED_PERMISSIONS } from "./config";

const main = async () => {
  const { config, network } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs();
  const payload = readPayloadFile(args.file, network);

  const payerPubkey = new web3.PublicKey(config.payer);
  const instruction = convertLzGovernanceSolanaPayloadToInstruction(
    payload,
    new web3.PublicKey(config.controllerProgramId),
    new web3.PublicKey(config.superAuthority),
    payerPubkey
  );

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );
  const superPermissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.superAuthority)
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

  // Assert super authority does not change
  const superAuthorityResp = resp[config.superAuthority];
  assertNoAccountChanges(superAuthorityResp.before, superAuthorityResp.after);

  // Assert super permission does not change when different
  // from the managed permission.
  if (permissionPda != superPermissionPda) {
    const superPermission = resp[superPermissionPda];
    assertNoAccountChanges(superPermission.before, superPermission.after);
  }

  // Assert Permission changes
  const permissionCodec = getPermissionCodec();
  const permissionAccount = resp[permissionPda];
  // Read Permission after discriminator
  const [permissionAfter] = permissionCodec.read(
    permissionAccount.after.data,
    1
  );

  // Only assert these changes if the Permission previously
  // existed.
  if (permissionAccount.before) {
    const [permissionBefore] = permissionCodec.read(
      permissionAccount.before.data,
      1
    );
    assert.equal(
      permissionAfter.controller.toString(),
      permissionBefore.controller.toString()
    );
    assert.equal(
      permissionAfter.authority.toString(),
      permissionBefore.authority.toString()
    );
  }

  // Assert permission matrix matches expected values
  assert.equal(permissionAfter.status, EXPECTED_PERMISSIONS.status);
  assert.equal(
    permissionAfter.canExecuteSwap,
    EXPECTED_PERMISSIONS.canExecuteSwap
  );
  assert.equal(
    permissionAfter.canFreezeController,
    EXPECTED_PERMISSIONS.canFreezeController
  );
  assert.equal(
    permissionAfter.canInvokeExternalTransfer,
    EXPECTED_PERMISSIONS.canInvokeExternalTransfer
  );
  assert.equal(permissionAfter.canLiquidate, EXPECTED_PERMISSIONS.canLiquidate);
  assert.equal(
    permissionAfter.canManagePermissions,
    EXPECTED_PERMISSIONS.canManagePermissions
  );
  assert.equal(
    permissionAfter.canManageReservesAndIntegrations,
    EXPECTED_PERMISSIONS.canManageReservesAndIntegrations
  );
  assert.equal(
    permissionAfter.canReallocate,
    EXPECTED_PERMISSIONS.canReallocate
  );
  assert.equal(
    permissionAfter.canSuspendPermissions,
    EXPECTED_PERMISSIONS.canSuspendPermissions
  );
  assert.equal(
    permissionAfter.canUnfreezeController,
    EXPECTED_PERMISSIONS.canUnfreezeController
  );
};

main();
