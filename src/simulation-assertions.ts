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
  } else if (!accountInfoBefore) {
    // NOTE: Simulation will return non-null AccountInfo for empty account.
    // So we assert the after simulation value is empty.
    assertAccountEmpty(accountInfoAfter);
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

/**
 * Assert that the Account is empty.
 *
 * NOTE: Simulation response will return non-null values for
 * AccountInfo (rentEpoch will be max val).
 */
export const assertAccountEmpty = (
  accountInfo: web3.AccountInfo<Buffer> | null
) => {
  if (!accountInfo) {
    return;
  }
  // Assert empty data
  assert.equal(accountInfo.data.length, 0);
  // Assert owned by SystemProgram
  assert.equal(accountInfo.owner.toString(), web3.PublicKey.default.toString());
  // Assert not executable
  assert.equal(accountInfo.executable, false);
  // Assert Lamports 0
  assert.equal(accountInfo.lamports, 0);
};
