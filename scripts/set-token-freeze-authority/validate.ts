import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readArgs,
  readPayloadFile,
  simulateInstructions,
  validateSuccess,
} from "../../src";
import { unpackMint } from "@solana/spl-token";
import { ACTION, CONFIG } from "./config";

const main = async () => {
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);

  const payerPubkey = new web3.PublicKey(CONFIG.payer);
  const instruction = convertWhSolanaGovernancePayloadToInstruction(
    payload,
    payerPubkey,
    new web3.PublicKey(CONFIG.authority)
  );

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Assert payer does not change aside from lamports
  const payerResp = resp[CONFIG.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Previous authority should not change
  const prevAuthority = resp[CONFIG.authority];
  assertNoAccountChanges(prevAuthority.before, prevAuthority.after);

  // Assert new authority did not change
  const newAuthorityResp = resp[CONFIG.newFreezeAuthority];
  assertNoAccountChanges(newAuthorityResp?.before, newAuthorityResp?.after);

  // check mint values
  const mintResp = resp[CONFIG.tokenMint];
  const tokenMintPubkey = new web3.PublicKey(CONFIG.tokenMint);
  const mintBefore = unpackMint(tokenMintPubkey, mintResp.before);
  const mintAfter = unpackMint(tokenMintPubkey, mintResp.after);

  // Assert values other than freeze authority did not change
  assert.equal(mintAfter.decimals, mintBefore.decimals);
  assert.equal(mintAfter.isInitialized, mintBefore.isInitialized);
  assert.equal(
    mintAfter.mintAuthority.toString(),
    mintBefore.mintAuthority.toString()
  );
  assert.equal(mintAfter.supply, mintBefore.supply);
  assert.deepEqual(mintAfter.tlvData, mintBefore.tlvData);

  // Assert freeze authority changed as expected
  assert.equal(mintAfter.freezeAuthority.toString(), CONFIG.newFreezeAuthority);

  validateSuccess(args.file);
};

main();
