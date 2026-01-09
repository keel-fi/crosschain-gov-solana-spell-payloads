import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateControllerPayloadWithLayerZeroForValidation,
  validateSuccess,
} from "../../src";
import {
  getPermissionCodec,
  derivePermissionPda,
  deriveControllerAuthorityPda,
} from "@keel-fi/svm-alm-controller";
import { address } from "@solana/kit";
import {
  NETWORK_CONFIGS,
  PERMISSIONS as EXPECTED_PERMISSIONS,
  ACTION,
} from "./config";


const main = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);
  const payerPubkey = new web3.PublicKey(config.payer);
  const cpiAuthority = new web3.PublicKey(config.superAuthority);

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
  const superPermissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.superAuthority),
  );

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  assertNoAccountChanges(controllerResp.before, controllerResp.after);

  // Assert controller authority does not change
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
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
  } else {
    assert.equal(permissionAfter.controller.toString(), config.controller);
    assert.equal(permissionAfter.authority.toString(), config.authority);
  }

  assert.equal(
    permissionAccount.after.owner.toString(),
    config.controllerProgramId,
    "Permission owner should be the controller program ID"
  );

  // Assert permission matrix matches expected values
  const observedPermission: typeof EXPECTED_PERMISSIONS = {
    status: permissionAfter.status,
    canManagePermissions: permissionAfter.canManagePermissions,
    canInvokeExternalTransfer: permissionAfter.canInvokeExternalTransfer,
    canExecuteSwap: permissionAfter.canExecuteSwap,
    canReallocate: permissionAfter.canReallocate,
    canFreezeController: permissionAfter.canFreezeController,
    canUnfreezeController: permissionAfter.canUnfreezeController,
    canManageReservesAndIntegrations: permissionAfter.canManageReservesAndIntegrations,
    canSuspendPermissions: permissionAfter.canSuspendPermissions,
    canLiquidate: permissionAfter.canLiquidate,
  };

  assert.deepEqual(
    observedPermission,
    EXPECTED_PERMISSIONS,
    `Permission mismatch:\nExpected: ${JSON.stringify(EXPECTED_PERMISSIONS, null, 2)}\nObserved: ${JSON.stringify(observedPermission, null, 2)}`
  );

  validateSuccess(args.file);
};

main();
