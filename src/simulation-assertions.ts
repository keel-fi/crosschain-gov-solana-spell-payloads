// Assertions for AccountInfo and SimulatedTransactionAccountInfo
import assert from "assert";
import { web3 } from "@coral-xyz/anchor";

/**
 * Asserts no data on the account has changed.
 * Used for validating accounts that should be
 * readonly in a transaction.
 */
export const assertNoAccountChanges = (
  accountInfoBefore: web3.AccountInfo<Buffer> | null,
  simulatedAccountInfoAfter: web3.SimulatedTransactionAccountInfo | null
) => {
  if (!accountInfoBefore && !simulatedAccountInfoAfter) {
    // Neither exists, so we consider them equal
    return;
  }

  // Convert both account data to Uint8Array for comparison
  const dataAfter = Buffer.from(simulatedAccountInfoAfter.data[0], "base64");
  const bytesBefore = new Uint8Array(accountInfoBefore.data.buffer);
  const bytesAfter = new Uint8Array(dataAfter.buffer);
  assert.deepEqual(bytesAfter, bytesBefore, "Data changed");
  assert.equal(
    simulatedAccountInfoAfter.lamports,
    accountInfoBefore.lamports,
    "Lamport value changed"
  );
  assert.equal(
    simulatedAccountInfoAfter.executable,
    accountInfoBefore.executable,
    "Executable value changed"
  );
  assert.equal(
    simulatedAccountInfoAfter.rentEpoch,
    accountInfoBefore.rentEpoch,
    "rentEpoch value changed"
  );
  assert.equal(
    simulatedAccountInfoAfter.owner.toString(),
    accountInfoBefore.owner.toString(),
    "owner value changed"
  );
};
