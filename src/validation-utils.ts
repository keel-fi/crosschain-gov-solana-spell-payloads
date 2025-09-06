import { web3 } from "@coral-xyz/anchor";

type SimulateResponse = Record<
  string,
  {
    before: web3.AccountInfo<Buffer> | null;
    after: web3.SimulatedTransactionAccountInfo | null;
  }
>;

export const simulateInstructions = async (
  connection: web3.Connection,
  payer: web3.PublicKey,
  instructions: web3.TransactionInstruction[]
): Promise<SimulateResponse> => {
  const accountPubkeyListNonUnique = instructions
    .map((ix) => ix.keys.map((meta) => meta.pubkey))
    .flat();
  const accountKeySet = new Set(accountPubkeyListNonUnique);
  const accountKeyList = Array.from(accountKeySet);
  const preTxAccountState = await connection.getMultipleAccountsInfo(
    accountKeyList
  );

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

  return accountKeyList.reduce((acc, key, i) => {
    acc[key.toString()] = {
      before: preTxAccountState[i],
      after: resp.accounts[i],
    };
    return acc;
  }, {} as SimulateResponse);
};

// TODO this is not very helpful since it will chop meaningful slices
// when they have bytes that are the same.
/**
 * Compare an AccountInfo with a SimulatedTransactionAccountInfo
 *
 * @param accountInfoBefore
 * @param simulatedAccountInfoAfter
 */
export const compareAccountInfoToSimulatedAccountInfo = (
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

  return dataChanges;
};
