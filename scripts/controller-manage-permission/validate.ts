import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  readArgs,
  readPayloadOrDecodePacket,
  simulatePayloadWithCompleteCrossChainFlow,
  validateSuccess,
} from "../../src";
import {
  getPermissionCodec,
  derivePermissionPda,
  deriveControllerAuthorityPda,
} from "@keel-fi/svm-alm-controller";
import { address } from "@solana/kit";
import {
  CONFIG,
  PERMISSIONS as EXPECTED_PERMISSIONS,
  ACTION,
} from "./config";


const main = async () => {
  const config = CONFIG;
  const args = readArgs(ACTION);
  // Support both file-based and Packet bytes-based payload reading
  const packetBytes = (args["packet-bytes"] || args.bytes) as string | undefined;
  const payload = readPayloadOrDecodePacket({
    file: args.file as string | undefined,
    packetBytes,
  });
  const payerPubkey = new web3.PublicKey(config.payer);
  const cpiAuthority = new web3.PublicKey(config.superAuthority);

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
  const superPermissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.superAuthority),
  );

  // Assert payer does not change, except for lamports
  // Use the actual payer from simulation (it generates a new keypair)
  const payerResp = resp[simulationPayer.toString()];
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

  const superPermission = resp[superPermissionPda];
  assertNoAccountChanges(superPermission.before, superPermission.after);

  // Assert controller program does not change
  const controllerProgramResp = resp[config.controllerProgramId];
  assertNoAccountChanges(
    controllerProgramResp.before,
    controllerProgramResp.after
  );

  // Assert Permission changes
  const permissionCodec = getPermissionCodec();
  const permissionAccount = resp[permissionPda];
  assert(permissionAccount.after, `Permission account ${permissionPda} should exist after simulation`);
  // Read Permission after discriminator
  const [permissionAfter] = permissionCodec.read(
    permissionAccount.after.data,
    1
  );

  // Only assert these changes if the Permission previously existed
  // and has valid data (not just an empty minimal account from simulation).
  // Permission account needs at least 65 bytes: 8 (discriminator) + 32 (controller) + 32 (authority) + fields
  if (permissionAccount.before && permissionAccount.before.data.length > 65) {
    // Validate that the existing permission was owned by the controller program
    assert.equal(
      permissionAccount.before.owner.toString(),
      config.controllerProgramId,
      "Existing permission should be owned by the controller program ID"
    );
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
    // Account didn't exist before or had empty data
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

  // Use file path for success message if available, otherwise indicate Packet bytes were used
  const sourceName = packetBytes ? "Packet bytes" : (args.file as string);
  validateSuccess(sourceName);
};

main();
