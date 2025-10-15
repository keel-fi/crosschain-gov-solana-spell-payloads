// Simulates an example upgrade transaction and asserts value changes
import assert from "assert";
import path from "path";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhGovernanceSolanaPayloadToInstruction,
  createLiteSvmWithInstructionAccounts,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateInstructionsWithLiteSVM,
} from "../../src";
import { unpackMint } from "@solana/spl-token";
import { NETWORK_CONFIGS } from "./config";

// NOTE: Due to the sequencing of the NTT upgrade transaction
// and NTT TransferMintAuthority, we must simulate in LiteSVM
// as Solana mainnet will not have a state possible where we may
// simulate the TransferMintAuthority prior to spell execution.
const main = async () => {
  const { config, network } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs();
  const payload = readPayloadFile(args.file, network);

  const payerPubkey = new web3.PublicKey(config.payer);
  const authorityPubkey = new web3.PublicKey(config.authority);
  const nttProgramIdPubkey = new web3.PublicKey(config.nttProgramId);
  const tokenMintPubkey = new web3.PublicKey(config.tokenMint);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
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

  // Create SVM environment for simulation with upgraded
  // NTT Program.
  const excludedAddresses = [config.nttProgramId];
  const svm = await createLiteSvmWithInstructionAccounts(
    connection,
    [instruction],
    payerPubkey,
    excludedAddresses
  );
  svm.withSigverify(false);
  svm.addProgramFromFile(
    nttProgramIdPubkey,
    path.resolve(__dirname, "./fixtures/ntt.so")
  );

  const resp = simulateInstructionsWithLiteSVM(svm, payerPubkey, [instruction]);

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
};

main();
