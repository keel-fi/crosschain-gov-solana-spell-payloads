import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhGovernanceSolanaPayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  simulateInstructions,
} from "../../src";
import { unpackMint } from "@solana/spl-token";
import { NETWORK_CONFIGS } from "./config";

const PAYLOAD = Buffer.from([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112,
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 116,
  45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 174, 245,
  52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 6, 221, 246, 225,
  215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237,
  95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169, 0, 2, 164, 250, 210,
  120, 92, 92, 54, 29, 152, 56, 87, 230, 68, 80, 111, 192, 142, 156, 49, 67,
  248, 15, 253, 239, 227, 228, 149, 171, 104, 164, 160, 233, 0, 1, 111, 119,
  110, 101, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 0, 0, 35, 6, 1, 1, 255, 193, 161, 53, 8, 52, 143, 122,
  143, 211, 169, 219, 249, 88, 172, 134, 35, 28, 115, 30, 133, 210, 76, 252,
  137, 107, 244, 56, 111, 146, 20, 136,
]);

const main = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);

  const payerPubkey = new web3.PublicKey(config.payer);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
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
