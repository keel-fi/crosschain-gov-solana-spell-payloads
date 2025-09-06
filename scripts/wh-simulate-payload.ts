// Simulates and validates the provided payload

import { web3 } from "@coral-xyz/anchor";
import { convertWhGovernanceSolanaPayloadToInstruction } from "../src";

const RPC_URL = "https://api.mainnet-beta.solana.com";

const compareAccountInfoToSimulatedAccountInfo = (
  accountInfoBefore: web3.AccountInfo<Buffer> | null,
  simulatedAccountInfoAfter: web3.SimulatedTransactionAccountInfo | null
) => {
  // TODO how to handle?
  if (!accountInfoBefore && simulatedAccountInfoAfter) {
    console.log("Account created");
  } else if (accountInfoBefore && !simulatedAccountInfoAfter) {
    console.log("Account closed");
  }

  const dataAfter = Buffer.from(simulatedAccountInfoAfter.data[0], "base64");
  const bytesBefore = new Uint8Array(accountInfoBefore.data.buffer);
  const bytesAfter = new Uint8Array(dataAfter.buffer);

  const minLength = Math.min(bytesBefore.length, bytesAfter.length);

  const dataChanges: {
    offset: number;
    before: number[];
    after: number[];
  }[] = [];

  let sliceIndex = 0;
  for (let i = 0; i < minLength; i++) {
    if (bytesBefore[i] !== bytesAfter[i]) {
      // Start or continue a group of differences
      const slice = dataChanges[sliceIndex];
      if (!slice) {
        dataChanges.push({
          offset: i,
          before: [bytesBefore[i]],
          after: [bytesAfter[i]],
        });
      } else {
        slice.before.push(bytesBefore[i]);
        slice.after.push(bytesAfter[i]);
      }
    } else if (dataChanges[sliceIndex]) {
      // End of a contiguous differing bytes
      sliceIndex += 1;
    }
  }

  if (!dataChanges.length) {
    console.log("No data changes");
  } else {
    // TODO do these need to be deserialized for each instruction type?
    console.log(dataChanges);
  }

  if (accountInfoBefore.lamports !== simulatedAccountInfoAfter.lamports) {
    console.log(
      `Lamports balance change ${accountInfoBefore.lamports} -> ${simulatedAccountInfoAfter.lamports}`
    );
  }
};

// TODO Replace with values based on the governance instance
const PAYER = new web3.PublicKey("TODO");
const OWNER = new web3.PublicKey("TODO");

const main = async () => {
  // TODO Replace with the generated payload buffer
  const payload = Buffer.from([]);
  const connection = new web3.Connection(RPC_URL);

  // Decode payload into instruction
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    payload,
    PAYER,
    OWNER
  );

  const accountPubkeyList = instruction.keys.map((meta) => meta.pubkey);
  const preTxAccountState = await connection.getMultipleAccountsInfo(
    accountPubkeyList
  );

  // Construct TX
  const blockhash = await connection.getLatestBlockhash();
  const messageV0 = new web3.TransactionMessage({
    payerKey: PAYER,
    recentBlockhash: blockhash.blockhash,
    instructions: [instruction],
  }).compileToV0Message();
  const transaction = new web3.VersionedTransaction(messageV0);

  const respContext = await connection.simulateTransaction(transaction, {
    // Skip signature verification before simulation
    sigVerify: false,
    // Return all accounts from the instruction we're simulating
    accounts: {
      encoding: "base64",
      addresses: accountPubkeyList.map((key) => key.toString()),
    },
  });
  const resp = respContext.value;

  // Compare each account
  for (let i = 0; i < accountPubkeyList.length; i++) {
    const pubkey = accountPubkeyList[i];
    const simulatedAccountInfo = resp.accounts[i];
    const accountInfoBefore = preTxAccountState[i];

    console.log(`${pubkey} diff:`);
    compareAccountInfoToSimulatedAccountInfo(
      accountInfoBefore,
      simulatedAccountInfo
    );
  }
};

main();
