// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import path from "path";
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import {
  assertNoAccountChanges,
  convertWhSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readArgs,
  readPayloadFile,
  validateSuccess,
} from "../../src";
import {
  simulateInstructionsWithSurfpool,
} from "../../src/simulation-utils";
import {
  surfnetSetAccount,
  surfnetWriteProgram,
} from "../../src/surfpool-utils";
import { unpackMint } from "@solana/spl-token";
import { ACTION, CONFIG } from "./config";

// NOTE: Due to the sequencing of the NTT upgrade transaction
// and NTT TransferMintAuthority, we must simulate with Surfpool
// loading a custom program binary, as Solana mainnet will not have
// a state possible where we may simulate the TransferMintAuthority
// prior to spell execution.
const main = async () => {
  const rpcUrl = getRpcEndpoint();
  const connection = new Connection(rpcUrl, "confirmed");
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);

  const payerKeypair = web3.Keypair.generate();
  const payerPubkey = payerKeypair.publicKey;
  const authorityPubkey = new web3.PublicKey(CONFIG.authority);
  const nttProgramIdPubkey = new web3.PublicKey(CONFIG.nttProgramId);
  const tokenMintPubkey = new web3.PublicKey(CONFIG.tokenMint);
  const instruction = convertWhSolanaGovernancePayloadToInstruction(
    payload,
    payerPubkey,
    authorityPubkey
  );

  // Config account for the above NTT Manager program
  const nttConfig = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    nttProgramIdPubkey
  )[0];
  const tokenAuthority = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token_authority")],
    nttProgramIdPubkey
  )[0];

  // Fund the payer account using surfnet_setAccount
  console.log("💰 Funding payer account...");
  await surfnetSetAccount(connection, payerPubkey, {
    lamports: 10_000_000_000, // 10 SOL
    data: Buffer.alloc(0),
    owner: web3.SystemProgram.programId,
    executable: false,
    rentEpoch: 0,
  });

  // Load the upgraded NTT program using surfnet_writeProgram
  console.log("📦 Loading upgraded NTT program...");
  // Use mainnet binary since surfpool simulates mainnet state
  const programPath = path.resolve(__dirname, `./fixtures/ntt-mainnet.so`);
  const programBinary = fs.readFileSync(programPath);
  const programBase64 = programBinary.toString("base64");
  await surfnetWriteProgram(connection, nttProgramIdPubkey, programBase64, 0);

  // Simulate the instruction using Surfpool
  console.log("🚀 Simulating transaction...");
  const resp = await simulateInstructionsWithSurfpool(connection, payerKeypair, [instruction]);

  // Assert payer does not change aside from lamports
  const payerResp = resp[payerPubkey.toString()];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Previous authority should not change
  const prevAuthority = resp[tokenAuthority.toString()];
  assertNoAccountChanges(prevAuthority?.before, prevAuthority?.after);

  // Assert new authority did not change
  const newAuthorityResp = resp[CONFIG.newMintAuthority];
  assertNoAccountChanges(newAuthorityResp?.before, newAuthorityResp?.after);

  // NTT config should not change
  const nttConfigResp = resp[nttConfig.toString()];
  assertNoAccountChanges(nttConfigResp.before, nttConfigResp.after);

  // NTT config owner should not change, except for Lamports
  // as the TX payer
  const nttConfigOwner = resp[CONFIG.authority];
  assertNoAccountChanges(nttConfigOwner.before, nttConfigOwner.after, true);

  // check mint values
  const mintResp = resp[CONFIG.tokenMint];
  const mintBefore = unpackMint(tokenMintPubkey, mintResp.before);
  const mintAfter = unpackMint(tokenMintPubkey, mintResp.after);

  // Assert values other than mint authority did not change
  assert.equal(mintAfter.decimals, mintBefore.decimals);
  assert.equal(mintAfter.isInitialized, mintBefore.isInitialized);
  assert.equal(
    mintAfter.freezeAuthority.toString(),
    mintBefore.freezeAuthority.toString()
  );
  assert.equal(mintAfter.supply, mintBefore.supply);
  assert.deepEqual(mintAfter.tlvData, mintBefore.tlvData);

  // Assert mint authority changed as expected
  assert.equal(mintAfter.mintAuthority.toString(), CONFIG.newMintAuthority);

  validateSuccess(args.file);
};

main();
