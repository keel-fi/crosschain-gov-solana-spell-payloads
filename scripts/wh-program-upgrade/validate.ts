// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readArgs,
  readPayloadOrDecodePacket,
  simulateInstructions,
  validateSuccess,
} from "../../src";
import { ACTION, CONFIG } from "./config";

// the layout of `UpgradeableLoaderState` can be found here:
// https://bonfida.github.io/doc-dex-program/solana_program/bpf_loader_upgradeable/enum.UpgradeableLoaderState.html

const TAG_LEN = 4;

// Buffer: tag (u32) + authority Option<Pubkey> (1 + 32) = 37
const CODE_OFFSET_BUFFER = TAG_LEN + 1 + 32;

// ProgramData: tag (u32) + slot (u64) + authority Option<Pubkey> (1 + 32) = 45
const CODE_OFFSET_PROGRAMDATA = TAG_LEN + 8 + 1 + 32;

const getProgramUpgradeAuthority = (buf: Buffer): web3.PublicKey | null => {
  const [option, ...pubkeyBuf] = buf.subarray(
    TAG_LEN + 8,
    CODE_OFFSET_PROGRAMDATA
  );
  if (option === 0) {
    return null;
  }
  return new web3.PublicKey(pubkeyBuf);
};
const getBufferCode = (buf: Buffer) => buf.subarray(CODE_OFFSET_BUFFER);
const getProgramDataCode = (buf: Buffer) =>
  buf.subarray(CODE_OFFSET_PROGRAMDATA);

export const validateWhProgramUpgrade = async (
  config: {outputFile: string},
  packetBytes: string | undefined,
) => {
  const payload = readPayloadOrDecodePacket({
    file: packetBytes ? undefined : config.outputFile,
    packetBytes,
  });

  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const payerPubkey = new web3.PublicKey(CONFIG.payer);
  const instruction = convertWhSolanaGovernancePayloadToInstruction(
    payload,
    payerPubkey,
    new web3.PublicKey(CONFIG.programUpgradeAuthority)
  );

  // Simulate the upgrade instruction execution
  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Assert payer does not change aside from lamports
  const payerResp = resp[CONFIG.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert program account does not change
  const programResp = resp[CONFIG.programAddress];
  assertNoAccountChanges(programResp.before, programResp.after);

  // Assert program authority does not change
  const programUpgradeAuthority = resp[CONFIG.programUpgradeAuthority];
  assertNoAccountChanges(
    programUpgradeAuthority.before,
    programUpgradeAuthority.after,
    // allow lamport changes only if the authority is the spill account
    CONFIG.programUpgradeAuthority === CONFIG.spillAccount
  );

  // Extract ProgramData account after simulation
  const programDataResp = resp[CONFIG.programDataAddress];

  // Slice out only the ELF code sections
  const newDataBufferResp = resp[CONFIG.newProgramBuffer];
  const bufferCodeBefore = getBufferCode(newDataBufferResp.before.data);
  const programCodeAfter = getProgramDataCode(programDataResp.after.data);

  // Assert program data changed
  assert.notDeepEqual(programDataResp.after.data, programDataResp.before.data);

  // Assert program authority did not change
  const upgradeAuthorityBefore = getProgramUpgradeAuthority(
    programDataResp.before.data
  );
  const upgradeAuthorityAfter = getProgramUpgradeAuthority(
    programDataResp.after.data
  );
  assert.deepEqual(upgradeAuthorityAfter, upgradeAuthorityBefore);

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
  const spillResp = resp[CONFIG.spillAccount];
  assert.ok(
    spillResp.after.lamports >= spillResp.before.lamports,
    "Spill account did not receive lamports from buffer"
  );
}

const main = async () => {
  const args = readArgs(ACTION);

  // Support both file-based and Packet bytes-based payload reading
  const packetBytes = (args["packet-bytes"] || args.bytes) as string | undefined;

  await validateWhProgramUpgrade({outputFile: args.file}, packetBytes);

  validateSuccess(args.file);
};

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
