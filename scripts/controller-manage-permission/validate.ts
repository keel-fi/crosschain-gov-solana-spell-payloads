import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzGovernanceSolanaPayloadToInstruction,
  LZ_CPI_AUTHORITY_PLACEHOLDER,
  simulateInstructions,
} from "../../src";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  getPermissionCodec,
  PermissionStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import { address } from "@solana/kit";

const RPC_URL = "https://api.devnet.solana.com";

const PAYLOAD = Buffer.from([
  0, 9, 112, 97, 121, 101, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 49, 248, 27, 19, 241, 190, 39, 129, 67,
  42, 133, 67, 152, 247, 2, 213, 205, 102, 26, 224, 57, 252, 42, 186, 157, 10,
  147, 26, 148, 127, 152, 91, 0, 0, 146, 173, 152, 122, 223, 52, 216, 217, 172,
  109, 100, 82, 87, 37, 173, 247, 7, 83, 11, 178, 177, 78, 25, 162, 82, 240, 9,
  12, 76, 101, 7, 10, 0, 0, 255, 193, 161, 53, 8, 52, 143, 122, 143, 211, 169,
  219, 249, 88, 172, 134, 35, 28, 115, 30, 133, 210, 76, 252, 137, 107, 244, 56,
  111, 146, 20, 136, 1, 0, 163, 196, 70, 16, 16, 39, 252, 123, 74, 73, 28, 58,
  86, 38, 196, 49, 215, 159, 253, 202, 186, 226, 125, 150, 252, 162, 177, 245,
  246, 107, 97, 22, 0, 0, 5, 202, 178, 34, 24, 128, 35, 247, 67, 148, 236, 174,
  233, 218, 243, 151, 193, 26, 42, 103, 37, 17, 173, 195, 73, 88, 193, 215, 189,
  177, 198, 115, 0, 0, 116, 91, 189, 30, 91, 154, 107, 121, 111, 16, 218, 195,
  137, 41, 29, 98, 188, 139, 167, 156, 127, 138, 252, 215, 139, 101, 189, 30,
  34, 225, 195, 222, 0, 1, 238, 74, 99, 49, 44, 205, 176, 89, 207, 112, 154, 46,
  32, 94, 214, 14, 115, 41, 133, 81, 160, 60, 130, 93, 27, 167, 150, 209, 3,
  229, 34, 170, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0,
]);

const PAYER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);

const CONTROLLER = "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6";
const AUTHORITY = "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2";
const SUPER_AUTHORITY = "JDNDBYaXdNiD7peLgRP3TZKwkeCJ3QEFwYkHk6DWbb75";
const EXPECTED_PERMISSIONS = {
  status: PermissionStatus.Active,
  canManagePermissions: false,
  canInvokeExternalTransfer: false,
  canExecuteSwap: false,
  canReallocate: true,
  canFreezeController: false,
  canUnfreezeController: false,
  canManageReservesAndIntegrations: false,
  canSuspendPermissions: false,
  canLiquidate: false,
};

const main = async () => {
  const connection = new web3.Connection(RPC_URL);
  const instruction = convertLzGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    new web3.PublicKey(SVM_ALM_CONTROLLER_PROGRAM_ADDRESS),
    LZ_CPI_AUTHORITY_PLACEHOLDER,
    PAYER
  );

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  const permissionPda = await derivePermissionPda(
    address(CONTROLLER),
    address(AUTHORITY)
  );
  const superPermissionPda = await derivePermissionPda(
    address(CONTROLLER),
    address(SUPER_AUTHORITY)
  );

  // Assert payer does not change, except for lamports
  const payerResp = resp[PAYER.toString()];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[CONTROLLER];
  assertNoAccountChanges(controllerResp.before, controllerResp.after);

  // Assert controller authority does not change
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(CONTROLLER)
  );
  const controllerAuthorityResp = resp[controllerAuthority];
  assertNoAccountChanges(
    controllerAuthorityResp?.before,
    controllerAuthorityResp?.after
  );

  // Assert authority does not change
  const authorityResp = resp[AUTHORITY];
  assertNoAccountChanges(authorityResp.before, authorityResp.after);

  // Assert super authority does not change
  const superAuthorityResp = resp[SUPER_AUTHORITY];
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
