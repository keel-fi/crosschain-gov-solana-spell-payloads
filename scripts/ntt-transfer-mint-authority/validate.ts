import assert from "assert";
import { web3 } from "@coral-xyz/anchor-29";
import {
  convertWhGovernanceSolanaPayloadToInstruction,
  simulateInstructions,
} from "../../src";

const PAYLOAD = Buffer.from(([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112, 
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 
  116, 45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 
  174, 245, 52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 6, 
  133, 111, 67, 171, 244, 170, 164, 162, 107, 50, 174, 142, 164, 203, 143, 
  173, 200, 224, 45, 38, 119, 3, 251, 213, 249, 218, 216, 95, 109, 0, 179, 
  0, 5, 75, 208, 197, 204, 130, 227, 14, 37, 5, 6, 179, 170, 80, 191, 38, 107, 
  219, 172, 12, 179, 231, 72, 100, 133, 134, 70, 201, 146, 29, 32, 118, 60, 1, 
  0, 181, 63, 32, 15, 141, 179, 87, 249, 225, 233, 130, 239, 14, 196, 179, 184, 
  121, 249, 246, 81, 109, 82, 71, 48, 126, 186, 240, 13, 24, 123, 229, 26, 0, 
  0, 159, 146, 220, 179, 101, 223, 33, 164, 164, 236, 35, 216, 255, 76, 192, 
  32, 205, 208, 152, 149, 248, 18, 156, 44, 47, 180, 50, 137, 188, 83, 249, 
  95, 0, 0, 7, 7, 49, 45, 29, 65, 218, 113, 240, 251, 40, 12, 22, 98, 205, 
  101, 235, 235, 46, 8, 89, 192, 203, 174, 63, 219, 220, 178, 108, 134, 224, 
  175, 0, 1, 6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 
  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 
  255, 0, 169, 0, 0, 0, 40, 87, 237, 187, 84, 168, 175, 241, 75, 5, 104, 238, 
  20, 144, 17, 150, 10, 99, 96, 143, 237, 71, 209, 247, 252, 198, 164, 27, 
  204, 205, 98, 91, 56, 155, 22, 68, 199, 20, 64, 232, 167
]));

const PAYER = new web3.PublicKey("N7qfnBZgt4GcCgpa8mUPGCZEG9sCESDizWDFamwvv8v");

const main = async () => {
  const connection = new web3.Connection("https://api.mainnet-beta.solana.com");

  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    PAYER,
    PAYER // owner does not matter here
  );

  console.log("instruction keys: ", instruction.keys);
  console.log("instruction data: ", instruction.data);
  console.log("instruction programId: ", instruction.programId);

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  // TODO: testing TBD
};

main()