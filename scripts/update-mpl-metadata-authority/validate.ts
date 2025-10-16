import assert from "assert";
import {
  assertNoAccountChanges,
  convertWhGovernanceSolanaPayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
} from "../../src";
import { web3 } from "@coral-xyz/anchor";
import { getMetadataDecoder } from "../../src/programs/metaplex-token-metadata";
import { ACTION, NETWORK_CONFIGS } from "./config";

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
    new web3.PublicKey(config.authority)
  );

  const [METADATA_ADDRESS] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new web3.PublicKey(config.mplProgramAddress).toBuffer(),
      new web3.PublicKey(config.tokenMint).toBuffer(),
    ],
    new web3.PublicKey(config.mplProgramAddress)
  );

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Assert payer does not change aside from lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Token Mint should not change
  const tokenMintResp = resp[config.tokenMint];
  assertNoAccountChanges(tokenMintResp.before, tokenMintResp.after);

  // Current Authority should not change
  const currentAuthResp = resp[config.authority];
  assertNoAccountChanges(currentAuthResp?.before, currentAuthResp?.after);

  // New Authority should not change
  const newAuthResp = resp[config.newAuthority];
  assertNoAccountChanges(newAuthResp?.before, newAuthResp?.after);

  // Metadata authority should have changed
  const metadataResp = resp[METADATA_ADDRESS.toString()];
  const metadataDecoder = getMetadataDecoder();
  const metadataBefore = metadataDecoder.decode(metadataResp.before.data);
  const metadataAfter = metadataDecoder.decode(metadataResp.after.data);
  assert.equal(metadataAfter.updateAuthority.toString(), config.newAuthority);

  // Other Metadata values should remain unchanged
  assert.deepEqual(metadataAfter.collection, metadataBefore.collection);
  assert.deepEqual(
    metadataAfter.collectionDetails,
    metadataBefore.collectionDetails
  );
  assert.deepEqual(metadataAfter.data, metadataBefore.data);
  assert.deepEqual(metadataAfter.editionNonce, metadataBefore.editionNonce);
  assert.deepEqual(metadataAfter.isMutable, metadataBefore.isMutable);
  assert.deepEqual(metadataAfter.key, metadataBefore.key);
  assert.deepEqual(metadataAfter.mint, metadataBefore.mint);
  assert.deepEqual(
    metadataAfter.primarySaleHappened,
    metadataBefore.primarySaleHappened
  );
  assert.deepEqual(
    metadataAfter.programmableConfig,
    metadataBefore.programmableConfig
  );
  assert.deepEqual(metadataAfter.tokenStandard, metadataBefore.tokenStandard);
  assert.deepEqual(metadataAfter.uses, metadataBefore.uses);
};

main();
