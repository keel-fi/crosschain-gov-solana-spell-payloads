import assert from "assert";
import {
  assertNoAccountChanges,
  convertWhSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readArgs,
  readPayloadOrDecodePacket,
  simulateInstructions,
  validateSuccess,
} from "../../src";
import { web3 } from "@coral-xyz/anchor";
import { getMetadataDecoder } from "../../src/programs/metaplex-token-metadata";
import { ACTION, CONFIG } from "./config";

export const validateUpdateMplMetadataAuthority = async (
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
    new web3.PublicKey(CONFIG.authority)
  );

  const [METADATA_ADDRESS] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new web3.PublicKey(CONFIG.mplProgramAddress).toBuffer(),
      new web3.PublicKey(CONFIG.tokenMint).toBuffer(),
    ],
    new web3.PublicKey(CONFIG.mplProgramAddress)
  );

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Assert payer does not change aside from lamports
  const payerResp = resp[CONFIG.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Token Mint should not change
  const tokenMintResp = resp[CONFIG.tokenMint];
  assertNoAccountChanges(tokenMintResp.before, tokenMintResp.after);

  // Current Authority should not change
  const currentAuthResp = resp[CONFIG.authority];
  assertNoAccountChanges(currentAuthResp?.before, currentAuthResp?.after);

  // New Authority should not change
  const newAuthResp = resp[CONFIG.newAuthority];
  assertNoAccountChanges(newAuthResp?.before, newAuthResp?.after);

  // Metadata authority should have changed
  const metadataResp = resp[METADATA_ADDRESS.toString()];
  const metadataDecoder = getMetadataDecoder();
  const metadataBefore = metadataDecoder.decode(metadataResp.before.data);
  const metadataAfter = metadataDecoder.decode(metadataResp.after.data);
  assert.equal(metadataAfter.updateAuthority.toString(), CONFIG.newAuthority);

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
}

const main = async () => {
  const args = readArgs(ACTION);
  
  // Support both file-based and Packet bytes-based payload reading
  const packetBytes = (args["packet-bytes"] || args.bytes) as string | undefined;

  await validateUpdateMplMetadataAuthority({outputFile: args.file}, packetBytes);

  validateSuccess(args.file);
};

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
