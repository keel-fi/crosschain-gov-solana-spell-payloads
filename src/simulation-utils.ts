import { web3 } from "@coral-xyz/anchor";
import { FailedTransactionMetadata, LiteSVM } from "litesvm";
import {
  convertSimulationToAccountInfo,
  getUniquePublicKeysFromInstructionsAndPayer,
} from "./utils";

type SimulateResponse = Record<
  string,
  {
    before: web3.AccountInfo<Buffer> | null;
    after: web3.AccountInfo<Buffer> | null;
  }
>;

/**
 * Simulates a set of instructions using the Connection's
 * `simulateTransaction` RPC method returning the before &
 * after state keyed by the account's address.
 * @param connection
 * @param payer
 * @param instructions
 * @returns
 */
export const simulateInstructions = async (
  connection: web3.Connection,
  payer: web3.PublicKey,
  instructions: web3.TransactionInstruction[]
): Promise<SimulateResponse> => {
  const accountKeyList = getUniquePublicKeysFromInstructionsAndPayer(
    instructions,
    payer
  );
  const preTxAccountState =
    await connection.getMultipleAccountsInfo(accountKeyList);

  // Construct TX
  const blockhash = await connection.getLatestBlockhash();
  const messageV0 = new web3.TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash.blockhash,
    instructions: instructions,
  }).compileToV0Message();
  const transaction = new web3.VersionedTransaction(messageV0);

  const respContext = await connection.simulateTransaction(transaction, {
    // Skip signature verification before simulation
    sigVerify: false,
    // Return all accounts from the instruction we're simulating
    accounts: {
      encoding: "base64",
      addresses: accountKeyList.map((key) => key.toString()),
    },
  });
  const resp = respContext.value;
  if (resp.err) {
    console.log("logs: ", resp.logs);
    throw new Error(JSON.stringify(resp.err));
  }

  return accountKeyList.reduce((acc, key, i) => {
    acc[key.toString()] = {
      before: preTxAccountState[i],
      after: convertSimulationToAccountInfo(resp.accounts[i]),
    };
    return acc;
  }, {} as SimulateResponse);
};

/**
 * Simulates a set of instructions within a supplied LiteSVM
 * environment, returning the before & after state keyed by
 * the account's address.
 * @param svm
 * @param payer
 * @param instructions
 * @returns
 */
export const simulateInstructionsWithLiteSVM = (
  svm: LiteSVM,
  payer: web3.PublicKey,
  instructions: web3.TransactionInstruction[]
): SimulateResponse => {
  const accountKeyList = getUniquePublicKeysFromInstructionsAndPayer(
    instructions,
    payer
  );
  const preTxAccountState = accountKeyList.map((key) => svm.getAccount(key));

  // Construct TX
  const blockhash = svm.latestBlockhash();
  const messageV0 = new web3.TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: instructions,
  }).compileToV0Message();
  const transaction = new web3.VersionedTransaction(messageV0);

  const resp = svm.sendTransaction(transaction);
  if (resp instanceof FailedTransactionMetadata) {
    console.log("logs: ", resp.meta().logs());
    throw new Error(resp.err().toString());
  }
  const postTxAccountState = accountKeyList.map((key) => svm.getAccount(key));

  const ret: SimulateResponse = {};
  for (let i = 0; i < accountKeyList.length; i++) {
    const pubkey = accountKeyList[i];

    let before: web3.AccountInfo<Buffer> | null = null;
    let after: web3.AccountInfo<Buffer> | null = null;
    if (preTxAccountState[i]) {
      before = {
        ...preTxAccountState[i],
        data: Buffer.from(preTxAccountState[i].data),
      };
    }
    if (postTxAccountState[i]) {
      after = {
        ...postTxAccountState[i],
        data: Buffer.from(postTxAccountState[i].data),
      };
    }

    ret[pubkey.toString()] = {
      before,
      after,
    };
  }

  return ret;
};
