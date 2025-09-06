// Simulates and validates the provided payload

import { web3 } from "@coral-xyz/anchor";
import {
  compareAccountInfoToSimulatedAccountInfo,
  convertWhGovernanceSolanaPayloadToInstruction,
  simulateInstructions,
} from "../src";

const RPC_URL = "https://api.mainnet-beta.solana.com";

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

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  // Compare each account
  for (let i = 0; i < resp.keys.length; i++) {
    const pubkey = resp.keys[i];
    const simulatedAccountInfo = resp.after[i];
    const accountInfoBefore = resp.before[i];

    console.log(`${pubkey} diff:`);
    compareAccountInfoToSimulatedAccountInfo(
      accountInfoBefore,
      simulatedAccountInfo
    );
  }
};

main();
