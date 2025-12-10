// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import fs from "fs";
import path from "path";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzSolanaGovernancePayloadToInstruction,
  createBufferAccount,
  createLiteSvmWithInstructionAccounts,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  resizeProgramDataAccount,
  simulateInstructions,
  simulateInstructionsWithLiteSVM,
  validateSuccess,
} from "../../src";
import { ACTION, NETWORK_CONFIGS } from "./config";

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

const main = async () => {
  const { config, network } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);

  const payerPubkey = new web3.PublicKey(config.payer);
  const bpfLoaderProgramId = new web3.PublicKey(
    "BPFLoaderUpgradeab1e11111111111111111111111"
  );
  const instruction = convertLzSolanaGovernancePayloadToInstruction(
    payload,
    bpfLoaderProgramId,
    new web3.PublicKey(config.programUpgradeAuthority),
    payerPubkey
  );

  const bufferPubkey = new web3.PublicKey(config.newProgramBuffer);
  
  // Check if program file is provided via PROGRAM_FILE env var or use default
  const programFile = path.resolve(__dirname, `../fixtures/ntt-mainnet.so`)

  let resp;
  
  if (programFile && fs.existsSync(programFile)) {
    // Use LiteSVM for local simulation with program file
    console.log(`Using LiteSVM for local simulation with program file: ${programFile}`);
    
    // Read program bytes from file
    const programBytes = fs.readFileSync(programFile);
    
    // Create LiteSVM environment, excluding the buffer account (we'll create it locally)
    const svm = await createLiteSvmWithInstructionAccounts(
      connection,
      [instruction],
      payerPubkey,
      [config.newProgramBuffer] // Exclude buffer from fetch
    );
    
    // Resize ProgramData account if needed to accommodate the new program
    // We need to do this first to calculate the required size for the buffer
    const programDataPubkey = new web3.PublicKey(config.programDataAddress);
    const programDataAccountRaw = svm.getAccount(programDataPubkey);
    let finalProgramDataSize: number | undefined;
    
    if (programDataAccountRaw) {
      // Convert LiteSVM account to web3.AccountInfo format
      const programDataAccount: web3.AccountInfo<Buffer> = {
        executable: programDataAccountRaw.executable,
        owner: programDataAccountRaw.owner,
        lamports: programDataAccountRaw.lamports,
        data: Buffer.from(programDataAccountRaw.data),
        rentEpoch: programDataAccountRaw.rentEpoch,
      };
      
      const resizedProgramData = resizeProgramDataAccount(
        programDataAccount,
        programBytes.length
      );
      finalProgramDataSize = resizedProgramData.data.length;
      svm.setAccount(programDataPubkey, resizedProgramData);
      if (resizedProgramData.data.length > programDataAccount.data.length) {
        console.log(
          `Resized ProgramData account from ${programDataAccount.data.length} to ${resizedProgramData.data.length} bytes`
        );
      }
    } else {
      // If ProgramData not found, calculate expected size
      const HEADER_SIZE = 4 + 8 + 1 + 32; // tag + slot + authority option + authority
      finalProgramDataSize = HEADER_SIZE + programBytes.length;
    }
    
    // Create buffer account locally with program bytes
    // Pass ProgramData size so buffer has enough lamports to fund the upgrade
    const bufferAuthority = new web3.PublicKey(config.programUpgradeAuthority);
    const bufferAccount = createBufferAccount(
      programBytes,
      bufferAuthority,
      finalProgramDataSize
    );
    svm.setAccount(bufferPubkey, bufferAccount);
    
    // Disable signature verification (authority signing is handled by governance)
    svm.withSigverify(false);
    
    // Simulate using LiteSVM
    resp = simulateInstructionsWithLiteSVM(svm, payerPubkey, [instruction]);
  } else {
    // Fall back to RPC-based simulation (requires buffer to exist on-chain)
    console.log("Using RPC simulation (buffer account must exist on-chain)");
    console.log("To use local simulation, set PROGRAM_FILE env var or place program file at:");
    console.log(`  ${path.resolve(__dirname, `./fixtures/program-${network}.so`)}`);
    resp = await simulateInstructions(connection, payerPubkey, [instruction]);
  }

  // Assert payer does not change aside from lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert program account does not change
  const programResp = resp[config.programAddress];
  assertNoAccountChanges(programResp.before, programResp.after);

  // Assert program authority does not change
  const programUpgradeAuthority = resp[config.programUpgradeAuthority];
  assertNoAccountChanges(
    programUpgradeAuthority.before,
    programUpgradeAuthority.after,
    // allow lamport changes only if the authority is the spill account
    config.programUpgradeAuthority === config.spillAccount
  );

  // Extract ProgramData account after simulation
  const programDataResp = resp[config.programDataAddress];

  // Slice out only the ELF code sections
  const newDataBufferResp = resp[config.newProgramBuffer];
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
  const spillResp = resp[config.spillAccount];
  assert.ok(
    spillResp.after.lamports >= spillResp.before.lamports,
    "Spill account did not receive lamports from buffer"
  );

  validateSuccess(args.file);
};

main();
