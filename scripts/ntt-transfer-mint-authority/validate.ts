// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
  validateSuccess,
} from "../../src";
import { unpackMint } from "@solana/spl-token";
import { ACTION, NETWORK_CONFIGS } from "./config";

const main = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);

  const payerPubkey = new web3.PublicKey(config.payer);
  const authorityPubkey = new web3.PublicKey(config.authority);
  const nttProgramIdPubkey = new web3.PublicKey(config.nttProgramId);
  const tokenMintPubkey = new web3.PublicKey(config.tokenMint);
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

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Assert payer does not change aside from lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Previous authority should not change
  const prevAuthority = resp[tokenAuthority.toString()];
  assertNoAccountChanges(prevAuthority?.before, prevAuthority?.after);

  // Assert new authority did not change
  const newAuthorityResp = resp[config.newMintAuthority];
  assertNoAccountChanges(newAuthorityResp?.before, newAuthorityResp?.after);

  // NTT config should not change
  const nttConfigResp = resp[nttConfig.toString()];
  assertNoAccountChanges(nttConfigResp.before, nttConfigResp.after);

  // NTT config owner should not change, except for Lamports
  // as the TX payer
  const nttConfigOwner = resp[config.authority];
  assertNoAccountChanges(nttConfigOwner.before, nttConfigOwner.after, true);

  // check mint values
  const mintResp = resp[config.tokenMint];
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
  assert.equal(mintAfter.mintAuthority.toString(), config.newMintAuthority);

  validateSuccess(args.file);
};

main();
