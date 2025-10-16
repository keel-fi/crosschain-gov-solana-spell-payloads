// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhGovernanceSolanaPayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
} from "../../src";
import { ACTION, NETWORK_CONFIGS } from "./config";

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
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);

  const payerPubkey = new web3.PublicKey(config.payer);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    payload,
    payerPubkey,
    new web3.PublicKey(config.programUpgradeAuthority)
  );

  // Simulate the upgrade instruction execution
  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Assert payer does not change aside from lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert program account does not change
  const programResp = resp[config.programAddress];
  assertNoAccountChanges(programResp.before, programResp.after);

  // Extract ProgramData account after simulation
  const programDataResp = resp[config.programDataAddress];

  // Slice out only the ELF code sections
  const newDataBufferResp = resp[config.newProgramBuffer];
  const bufferCodeBefore = getBufferCode(newDataBufferResp.before.data);
  const programCodeAfter = getProgramDataCode(programDataResp.after.data);

  // Assert program data changed
  assert.notDeepEqual(programDataResp.after.data, programDataResp.before.data);

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
  assert.equal(newDataBufferResp.after.lamports, 0);

  // Assert spill account got lamports from closed buffer
  const spillResp = resp[config.programUpgradeAuthority];
  assert.ok(
    spillResp.after.lamports > spillResp.before.lamports,
    "Spill account did not receive lamports from buffer"
  );
};

main();
