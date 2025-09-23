// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  convertWhGovernanceSolanaPayloadToInstruction,
  simulateInstructions,
} from "../../src";

const RPC_URL = "https://api.devnet.solana.com";

// Copied from the output.json
const PAYLOAD = Buffer.from([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112,
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 116,
  45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 174, 245,
  52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 2, 168, 246, 145,
  78, 136, 161, 176, 226, 16, 21, 62, 247, 99, 174, 43, 0, 194, 185, 61, 22,
  193, 36, 210, 192, 83, 122, 16, 4, 128, 0, 0, 0, 7, 206, 3, 55, 193, 93, 9,
  154, 184, 155, 29, 64, 47, 213, 135, 125, 244, 10, 9, 222, 212, 133, 109, 173,
  189, 195, 55, 213, 16, 220, 6, 97, 239, 0, 1, 160, 90, 97, 173, 10, 59, 151,
  198, 83, 179, 77, 253, 83, 250, 151, 199, 241, 246, 159, 243, 33, 27, 96, 188,
  149, 134, 149, 164, 87, 22, 171, 207, 0, 1, 128, 220, 211, 153, 156, 200, 99,
  220, 65, 193, 211, 103, 118, 58, 225, 231, 61, 106, 169, 166, 209, 38, 252,
  60, 205, 32, 17, 164, 162, 199, 107, 27, 0, 1, 37, 249, 146, 67, 177, 163,
  234, 226, 85, 154, 57, 97, 164, 16, 202, 67, 147, 213, 244, 142, 190, 63, 92,
  141, 154, 197, 50, 67, 68, 24, 132, 119, 0, 1, 6, 167, 213, 23, 25, 44, 92,
  81, 33, 140, 201, 76, 61, 74, 241, 127, 88, 218, 238, 8, 155, 161, 253, 68,
  227, 219, 217, 138, 0, 0, 0, 0, 0, 0, 6, 167, 213, 23, 24, 199, 116, 201, 40,
  86, 99, 152, 105, 29, 94, 182, 139, 94, 184, 163, 155, 75, 109, 92, 115, 85,
  91, 33, 0, 0, 0, 0, 0, 0, 37, 249, 146, 67, 177, 163, 234, 226, 85, 154, 57,
  97, 164, 16, 202, 67, 147, 213, 244, 142, 190, 63, 92, 141, 154, 197, 50, 67,
  68, 24, 132, 119, 1, 0, 0, 4, 3, 0, 0, 0,
]);

const PAYER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);
const PROGRAM_ID = new web3.PublicKey(
  "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc"
);
const UPGRADE_AUTHORITY = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);
const PROGRAM_DATA = new web3.PublicKey(
  "EsBqEQkFSsiRifBgQmtoXJheDJfYEMhgHSETn2MKgGV4"
);
const NEW_DATA_BUFFER = new web3.PublicKey(
  "9g2VA38gRTvVvPXQPiUVcPH4HGPMVCRvax5HKVEaBLta"
);

// the layout of `UpgradeableLoaderState` can be found here:
// https://bonfida.github.io/doc-dex-program/solana_program/bpf_loader_upgradeable/enum.UpgradeableLoaderState.html

// Buffer: tag (u32) + authority Option<Pubkey> (1 + 32) = 37
const CODE_OFFSET_BUFFER = 4 + 1 + 32;

// ProgramData: tag (u32) + slot (u64) + authority Option<Pubkey> (1 + 32) = 45
const CODE_OFFSET_PROGRAMDATA = 4 + 8 + 1 + 32;

const getBufferCode = (buf: Buffer) => buf.subarray(CODE_OFFSET_BUFFER);
const getProgramDataCode = (buf: Buffer) =>
  buf.subarray(CODE_OFFSET_PROGRAMDATA);

const main = async () => {
  const connection = new web3.Connection(RPC_URL);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    PAYER,
    PAYER // owner does not matter here
  );

  // Simulate the upgrade instruction execution
  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  // Extract ProgramData account after simulation
  const programDataResp = resp[PROGRAM_DATA.toString()];
  const programDataAfter = Buffer.from(programDataResp.after.data[0], "base64");

  // Slice out only the ELF code sections
  const newDataBufferResp = resp[NEW_DATA_BUFFER.toString()];
  const bufferCodeBefore = getBufferCode(newDataBufferResp.before.data);
  const programCodeAfter = getProgramDataCode(programDataAfter);

  // Assert program data changed
  assert.notDeepEqual(
    new Uint8Array(programDataAfter),
    new Uint8Array(programDataResp.before.data)
  );

  // Assert the new ProgramData code begins with exactly the bytes from the Buffer
  assert.deepEqual(
    bufferCodeBefore,
    programCodeAfter.subarray(0, bufferCodeBefore.length)
  );

  // Assert that any extra ProgramData space is just zero padding
  assert.ok(
    programCodeAfter.subarray(bufferCodeBefore.length).every((b) => b === 0),
    "ProgramData trailing padding not zero"
  );

  // Assert buffer was closed (balance is 0)
  assert.equal(resp[NEW_DATA_BUFFER.toString()].after.lamports, 0);

  // Assert spill account got lamports from closed buffer
  const spillResp = resp[UPGRADE_AUTHORITY.toString()];
  assert.ok(
    spillResp.after.lamports > spillResp.before.lamports,
    "Spill account did not receive lamports from buffer"
  );
};

main();
