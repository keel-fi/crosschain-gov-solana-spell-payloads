import { web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import {
  convertSimulationToAccountInfo,
  getUniquePublicKeysFromInstructionsAndPayer,
} from "./utils";

export type SimulateResponse = Record<
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
 * Simulates a set of instructions within Surfpool using RPC simulation,
 * returning the before & after state keyed by the account's address.
 * 
 * This is the Surfpool-based replacement for the former LiteSVM-based simulation.
 * Surfpool automatically fetches mainnet accounts on demand (JIT).
 * 
 * @param connection - Connection to Surfpool RPC
 * @param payer - Payer keypair for signing the transaction
 * @param instructions - Instructions to simulate
 * @returns SimulateResponse with before/after account states
 */
export const simulateInstructionsWithSurfpool = async (
  connection: Connection,
  payer: web3.Keypair,
  instructions: web3.TransactionInstruction[]
): Promise<SimulateResponse> => {
  const accountKeyList = getUniquePublicKeysFromInstructionsAndPayer(
    instructions,
    payer.publicKey
  );
  
  // Fetch pre-state from Surfpool (will auto-load from mainnet if needed)
  const preTxAccountState = await connection.getMultipleAccountsInfo(accountKeyList);

  // Construct TX
  const blockhash = await connection.getLatestBlockhash();
  const messageV0 = new web3.TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: instructions,
  }).compileToV0Message();
  const transaction = new web3.VersionedTransaction(messageV0);
  transaction.sign([payer]);

  // Simulate using RPC
  const respContext = await connection.simulateTransaction(transaction, {
    sigVerify: false,
    accounts: {
      encoding: "base64",
      addresses: accountKeyList.map((key) => key.toString()),
    },
  });
  
  const resp = respContext.value;
  if (resp.err) {
    console.log("logs: ", resp.logs);
    // Provide more detailed error information
    const errorDetails = typeof resp.err === 'object' && resp.err !== null
      ? JSON.stringify(resp.err, null, 2)
      : String(resp.err);
    throw new Error(`Simulation failed: ${errorDetails}`);
  }

  const ret: SimulateResponse = {};
  for (let i = 0; i < accountKeyList.length; i++) {
    const pubkey = accountKeyList[i];

    ret[pubkey.toString()] = {
      before: preTxAccountState[i],
      after: convertSimulationToAccountInfo(resp.accounts?.[i] ?? null),
    };
  }

  return ret;
};
