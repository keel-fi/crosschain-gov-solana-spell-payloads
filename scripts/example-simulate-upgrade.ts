// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhGovernanceSolanaPayloadToInstruction,
  simulateInstructions,
} from "../src";

const RPC_URL = "https://api.devnet.solana.com";

// Copied from the output.json
const PAYLOAD = Buffer.from([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112,
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 116,
  45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 174, 245,
  52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 2, 168, 246, 145,
  78, 136, 161, 176, 226, 16, 21, 62, 247, 99, 174, 43, 0, 194, 185, 61, 22,
  193, 36, 210, 192, 83, 122, 16, 4, 128, 0, 0, 0, 7, 225, 5, 35, 18, 86, 53, 7,
  203, 126, 54, 65, 203, 50, 221, 50, 140, 27, 79, 127, 129, 175, 160, 40, 102,
  117, 82, 107, 195, 155, 66, 150, 74, 1, 0, 238, 74, 99, 49, 44, 205, 176, 89,
  207, 112, 154, 46, 32, 94, 214, 14, 115, 41, 133, 81, 160, 60, 130, 93, 27,
  167, 150, 209, 3, 229, 34, 170, 1, 0, 6, 252, 156, 107, 66, 80, 73, 189, 53,
  235, 17, 153, 88, 179, 53, 122, 32, 42, 200, 34, 140, 1, 133, 140, 86, 253, 7,
  252, 210, 212, 113, 72, 1, 0, 37, 249, 146, 67, 177, 163, 234, 226, 85, 154,
  57, 97, 164, 16, 202, 67, 147, 213, 244, 142, 190, 63, 92, 141, 154, 197, 50,
  67, 68, 24, 132, 119, 1, 0, 6, 167, 213, 23, 25, 44, 92, 81, 33, 140, 201, 76,
  61, 74, 241, 127, 88, 218, 238, 8, 155, 161, 253, 68, 227, 219, 217, 138, 0,
  0, 0, 0, 0, 0, 6, 167, 213, 23, 24, 199, 116, 201, 40, 86, 99, 152, 105, 29,
  94, 182, 139, 94, 184, 163, 155, 75, 109, 92, 115, 85, 91, 33, 0, 0, 0, 0, 1,
  0, 37, 249, 146, 67, 177, 163, 234, 226, 85, 154, 57, 97, 164, 16, 202, 67,
  147, 213, 244, 142, 190, 63, 92, 141, 154, 197, 50, 67, 68, 24, 132, 119, 0,
  1, 0, 4, 3, 0, 0, 0,
]);

const PAYER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);

const main = async () => {
  const connection = new web3.Connection(RPC_URL);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    PAYER,
    PAYER // owner does not matter here
  );

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  const PROGRAM_ADDRESS = "H3BpbuheXwBnfxjb2L66mxZ9nFhRmUentYwQDspd6yJ9";
  const PROGRAM_DATA_ADDRESS = "G9PGxifnjuhcJHtVV4XMgRMY3ZsWyvyQsKHqVnMf4XRB";

  // Assert the Program data changed
  const programDataResp = resp[PROGRAM_DATA_ADDRESS];
  const programDataAfter = Buffer.from(programDataResp.after.data[0], "base64");
  assert.notDeepEqual(
    new Uint8Array(programDataAfter),
    new Uint8Array(programDataResp.before.data)
  );

  const programResp = resp[PROGRAM_ADDRESS];
  assertNoAccountChanges(programResp.before, programResp.after);
};

main();
