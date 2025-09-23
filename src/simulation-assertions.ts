// Assertions for AccountInfo
import assert from "assert";
import { web3 } from "@coral-xyz/anchor";

/**
 * Asserts no data on the account has changed.
 * Used for validating accounts that should be
 * readonly in a transaction.
 * @param accountInfoBefore - AccountInfo state before TX
 * @param accountInfoAfter - AccountInfo state after TX
 * @param allowLamportChange - Skip assertion on lamport values in the scenario this Account is the payer of the TX.
 */
export const assertNoAccountChanges = (
  accountInfoBefore: web3.AccountInfo<Buffer> | null,
  accountInfoAfter: web3.AccountInfo<Buffer> | null,
  allowLamportChange = false
) => {
  if (!accountInfoBefore && !accountInfoAfter) {
    // Neither exists, so we consider them equal
    return;
  }

  assert.deepEqual(
    accountInfoAfter.data,
    accountInfoBefore.data,
    "Data changed"
  );
  if (!allowLamportChange) {
    assert.equal(
      accountInfoAfter.lamports,
      accountInfoBefore.lamports,
      "Lamport value changed"
    );
  }
  assert.equal(
    accountInfoAfter.executable,
    accountInfoBefore.executable,
    "Executable value changed"
  );
  assert.equal(
    accountInfoAfter.rentEpoch,
    accountInfoBefore.rentEpoch,
    "rentEpoch value changed"
  );
  assert.equal(
    accountInfoAfter.owner.toString(),
    accountInfoBefore.owner.toString(),
    "owner value changed"
  );
};
