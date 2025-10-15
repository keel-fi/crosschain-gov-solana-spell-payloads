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
import { unpackMint } from "@solana/spl-token";
import { NETWORK_CONFIGS } from "./config";

const main = async () => {
  const { config, network } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs();
  const payload = readPayloadFile(args.file, network);

  const payerPubkey = new web3.PublicKey(config.payer);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    payload,
    payerPubkey,
    new web3.PublicKey(config.authority)
  );

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Previous authority should not change
  const prevAuthority = resp[config.authority];
  assertNoAccountChanges(prevAuthority.before, prevAuthority.after);

  // Assert new authority did not change
  const newAuthorityResp = resp[config.newFreezeAuthority];
  assertNoAccountChanges(newAuthorityResp?.before, newAuthorityResp?.after);

  // check mint values
  const mintResp = resp[config.tokenMint];
  const tokenMintPubkey = new web3.PublicKey(config.tokenMint);
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
  assert.equal(mintAfter.freezeAuthority.toString(), config.newFreezeAuthority);
};

main();
