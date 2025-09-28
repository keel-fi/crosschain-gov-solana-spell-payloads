// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  convertWhGovernanceSolanaPayloadToInstruction,
  simulateInstructions,
  assertNoAccountChanges
} from "../../src";

const RPC_URL = "https://api.devnet.solana.com";

const PAYLOAD = Buffer.from([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112, 
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 
  116, 45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 
  174, 245, 52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 2, 
  168, 246, 145, 78, 136, 161, 176, 226, 16, 21, 62, 247, 99, 174, 43, 0, 
  194, 185, 61, 22, 193, 36, 210, 192, 83, 122, 16, 4, 128, 0, 0, 0, 4, 206, 
  3, 55, 193, 93, 9, 154, 184, 155, 29, 64, 47, 213, 135, 125, 244, 10, 9, 222, 
  212, 133, 109, 173, 189, 195, 55, 213, 16, 220, 6, 97, 239, 0, 1, 160, 90, 
  97, 173, 10, 59, 151, 198, 83, 179, 77, 253, 83, 250, 151, 199, 241, 246, 159, 
  243, 33, 27, 96, 188, 149, 134, 149, 164, 87, 22, 171, 207, 0, 1, 0, 0, 0, 0, 
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
  0, 0, 0, 0, 37, 249, 146, 67, 177, 163, 234, 226, 85, 154, 57, 97, 164, 16, 
  202, 67, 147, 213, 244, 142, 190, 63, 92, 141, 154, 197, 50, 67, 68, 24, 132, 
  119, 1, 1, 0, 8, 6, 0, 0, 0, 232, 3, 0, 0
]);

const PAYER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);
const PROGRAM_DATA = new web3.PublicKey(
  "EsBqEQkFSsiRifBgQmtoXJheDJfYEMhgHSETn2MKgGV4"
);
const PROGRAM_ADDRESS = new web3.PublicKey(
  "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc"
);

const ADDITIONAL_BYTES = 1_000;

const main = async () => {
  const connection = new web3.Connection(RPC_URL);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    PAYER,
    PAYER
  );

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  // Program data account should have the space increased by the correct amount
  const programDataAccount = resp[PROGRAM_DATA.toString()];
  const dataLengthBefore = programDataAccount.before.data.byteLength;
  const dataLengthAfter = programDataAccount.after.data.byteLength;
  assert.equal(dataLengthBefore + ADDITIONAL_BYTES, dataLengthAfter);

  // Previous program account should not change
  const programAccount = resp[PROGRAM_ADDRESS.toString()];
  assertNoAccountChanges(programAccount?.before, programAccount?.after);

  // Payer should have only lamports changed
  const payerAccount = resp[PAYER.toString()];
  assertNoAccountChanges(payerAccount.before, payerAccount.after, true)
}

main()