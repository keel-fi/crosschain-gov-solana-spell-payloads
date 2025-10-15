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
  simulateInstructionsWithLiteSVM,
} from "../../src";
import { unpackMint } from "@solana/spl-token";
import { NETWORK_CONFIGS } from "./config";

// Copied from the output.json
const PAYLOAD = Buffer.from([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112,
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 116,
  45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 174, 245,
  52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 160, 90, 97, 173,
  10, 59, 151, 198, 83, 179, 77, 253, 83, 250, 151, 199, 241, 246, 159, 243, 33,
  27, 96, 188, 149, 134, 149, 164, 87, 22, 171, 207, 0, 5, 111, 119, 110, 101,
  114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 0, 23, 211, 98, 159, 254, 46, 203, 253, 37, 146, 244, 159, 101,
  186, 52, 60, 25, 34, 128, 221, 86, 160, 25, 229, 123, 44, 176, 218, 141, 157,
  249, 250, 0, 0, 80, 34, 42, 155, 98, 77, 54, 113, 10, 234, 25, 189, 75, 200,
  91, 19, 17, 79, 3, 26, 140, 212, 118, 35, 237, 167, 83, 191, 84, 38, 222, 225,
  0, 0, 244, 181, 29, 37, 14, 218, 57, 22, 114, 127, 162, 55, 148, 116, 113,
  136, 165, 182, 126, 137, 124, 32, 97, 119, 133, 20, 84, 231, 100, 13, 245,
  218, 0, 1, 6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235,
  121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0,
  169, 0, 0, 0, 40, 87, 237, 187, 84, 168, 175, 241, 75, 37, 249, 146, 67, 177,
  163, 234, 226, 85, 154, 57, 97, 164, 16, 202, 67, 147, 213, 244, 142, 190, 63,
  92, 141, 154, 197, 50, 67, 68, 24, 132, 119,
]);

// NOTE: Due to the sequencing of the NTT upgrade transaction
// and NTT TransferMintAuthority, we must simulate in LiteSVM
// as Solana mainnet will not have a state possible where we may
// simulate the TransferMintAuthority prior to spell execution.
const main = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);

  const payerPubkey = new web3.PublicKey(config.payer);
  const authorityPubkey = new web3.PublicKey(config.authority);
  const nttProgramIdPubkey = new web3.PublicKey(config.nttProgramId);
  const tokenMintPubkey = new web3.PublicKey(config.tokenMint);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
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
