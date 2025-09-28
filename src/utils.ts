import { web3 } from "@coral-xyz/anchor";
import { Instruction, isInstructionWithAccounts, isSignerRole, isWritableRole } from "@solana/kit";
import { LiteSVM } from "litesvm";

/**
 * Convert a SimulatedTransactionAccountInfo to AccountInfo
 */
export const convertSimulationToAccountInfo = (
  sim: web3.SimulatedTransactionAccountInfo
): web3.AccountInfo<Buffer> => {
  return {
    executable: sim.executable,
    owner: new web3.PublicKey(sim.owner),
    lamports: sim.lamports,
    data: Buffer.from(sim.data[0], "base64"),
    rentEpoch: sim.rentEpoch,
  };
};

/**
 * Return a set of de-duplicated keys from a list of instructions.
 * @param instructions
 * @returns
 */
export const getUniquePublicKeysFromInstructions = (
  instructions: web3.TransactionInstruction[]
): web3.PublicKey[] => {
  const accountPubkeyListNonUnique = instructions
    .map((ix) => ix.keys.map((meta) => meta.pubkey.toString()))
    .flat();
  const accountKeySet = new Set(accountPubkeyListNonUnique);
  return Array.from(accountKeySet, (k, _) => new web3.PublicKey(k));
};

/**
 * Seed a LiteSVM environment with all accounts used within a set
 * of instructions from their state on the supplied connection.
 * @param connection
 * @param instructions
 * @param excludedAddresses
 * @returns
 */
export const createLiteSvmWithInstructionAccounts = async (
  connection: web3.Connection,
  instructions: web3.TransactionInstruction[],
  excludedAddresses: string[]
) => {
  // Get all Accounts needed for environment
  const dedupedAddresses = getUniquePublicKeysFromInstructions(instructions);
  const filteredkeys = dedupedAddresses.filter(
    (a) => !excludedAddresses.includes(a.toString())
  );

  // Fetch accounts from the connection
  const allAccounts = await connection.getMultipleAccountsInfo(filteredkeys);

  // Create LiteSVM environment
  const svm = new LiteSVM();
  // Set Accounts from connection in LiteSVM
  allAccounts.forEach((acctInfo, i) => {
    if (!acctInfo) {
      return;
    }
    const pubkey = filteredkeys[i];
    const fixedAcctInfo = {
      ...acctInfo,
      // The RPC sends back a rentEpoch greater than u64::MAX::MAX.
      // So we detect such a number and resolve to an arbitrarily high
      // epoch number.
      rentEpoch:
        acctInfo.rentEpoch === 18_446_744_073_709_552_000
          ? 999_999_999_999_999
          : acctInfo.rentEpoch,
    };
    svm.setAccount(pubkey, fixedAcctInfo);
  });

  return svm;
};

/**
 * Convert a @solana/kit instruction to a web3.js instruction.
 * For the conversion the other way, use @solana/compat.
 * @param kitInstruction 
 * @returns 
 */
export function convertKitInstructionToWeb3Js(
  kitInstruction: Instruction
): web3.TransactionInstruction {
  const keys: web3.AccountMeta[] = [];
  if (isInstructionWithAccounts(kitInstruction)) {
    for (const account of kitInstruction.accounts) {
      keys.push({
        pubkey: new web3.PublicKey(account.address),
        isSigner: isSignerRole(account.role),
        isWritable: isWritableRole(account.role),
      });
    }
  }

  return new web3.TransactionInstruction({
    keys: keys,
    programId: new web3.PublicKey(kitInstruction.programAddress),
    data: Buffer.from(kitInstruction.data || new Uint8Array()),
  });
}