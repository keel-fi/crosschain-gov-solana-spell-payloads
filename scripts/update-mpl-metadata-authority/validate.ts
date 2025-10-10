import assert from "assert";
import {
  assertNoAccountChanges,
  convertWhGovernanceSolanaPayloadToInstruction,
  simulateInstructions,
  SKY_WH_GOVERNANCE_AUTHORITY,
  USDS_TOKEN_MINT,
} from "../../src";
import { web3 } from "@coral-xyz/anchor";
import {
  getMetadataDecoder,
  MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
} from "../../src/programs/metaplex-token-metadata";

const RPC_URL = "https://api.mainnet-beta.solana.com";

const PAYLOAD = Buffer.from([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112,
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 116,
  45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 174, 245,
  52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 11, 112, 101, 177,
  227, 209, 124, 69, 56, 157, 82, 127, 107, 4, 195, 205, 88, 184, 108, 115, 26,
  160, 253, 181, 73, 182, 209, 188, 3, 248, 41, 70, 0, 11, 75, 208, 197, 204,
  130, 227, 14, 37, 5, 6, 179, 170, 80, 191, 38, 107, 219, 172, 12, 179, 231,
  72, 100, 133, 134, 70, 201, 146, 29, 32, 118, 60, 1, 0, 11, 112, 101, 177,
  227, 209, 124, 69, 56, 157, 82, 127, 107, 4, 195, 205, 88, 184, 108, 115, 26,
  160, 253, 181, 73, 182, 209, 188, 3, 248, 41, 70, 0, 0, 11, 112, 101, 177,
  227, 209, 124, 69, 56, 157, 82, 127, 107, 4, 195, 205, 88, 184, 108, 115, 26,
  160, 253, 181, 73, 182, 209, 188, 3, 248, 41, 70, 0, 0, 7, 7, 49, 45, 29, 65,
  218, 113, 240, 251, 40, 12, 22, 98, 205, 101, 235, 235, 46, 8, 89, 192, 203,
  174, 63, 219, 220, 178, 108, 134, 224, 175, 0, 0, 113, 128, 157, 252, 130,
  137, 33, 247, 6, 89, 134, 154, 8, 34, 191, 4, 196, 43, 130, 61, 81, 139, 252,
  17, 254, 154, 123, 101, 210, 33, 165, 143, 0, 1, 11, 112, 101, 177, 227, 209,
  124, 69, 56, 157, 82, 127, 107, 4, 195, 205, 88, 184, 108, 115, 26, 160, 253,
  181, 73, 182, 209, 188, 3, 248, 41, 70, 0, 0, 112, 97, 121, 101, 114, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 6, 167, 213, 23, 24, 123, 209, 102, 53, 218, 212, 4,
  85, 253, 194, 192, 193, 36, 198, 143, 33, 86, 117, 165, 219, 186, 203, 95, 8,
  0, 0, 0, 0, 0, 11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107, 4,
  195, 205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182, 209, 188, 3, 248, 41,
  70, 0, 0, 11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107, 4, 195,
  205, 88, 184, 108, 115, 26, 160, 253, 181, 73, 182, 209, 188, 3, 248, 41, 70,
  0, 0, 0, 44, 50, 1, 1, 37, 249, 146, 67, 177, 163, 234, 226, 85, 154, 57, 97,
  164, 16, 202, 67, 147, 213, 244, 142, 190, 63, 92, 141, 154, 197, 50, 67, 68,
  24, 132, 119, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

const utf8Encode = new TextEncoder();

const PAYER = new web3.PublicKey("PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2");
const [METADATA_ADDRESS] = web3.PublicKey.findProgramAddressSync(
  [
    utf8Encode.encode("metadata"),
    new web3.PublicKey(
      MPL_TOKEN_METADATA_PROGRAM_ADDRESS.toString()
    ).toBuffer(),
    USDS_TOKEN_MINT.toBuffer(),
  ],
  new web3.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ADDRESS.toString())
);
// TODO update with LZ Governance Authority
const NEW_AUTHORITY = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);

const main = async () => {
  const connection = new web3.Connection(RPC_URL);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    PAYER,
    SKY_WH_GOVERNANCE_AUTHORITY
  );

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  // Token Mint should not change
  const tokenMintResp = resp[USDS_TOKEN_MINT.toString()];
  assertNoAccountChanges(tokenMintResp.before, tokenMintResp.after);

  // Current Authority should not change
  const currentAuthResp = resp[SKY_WH_GOVERNANCE_AUTHORITY.toString()];
  assertNoAccountChanges(currentAuthResp?.before, currentAuthResp?.after);

  // New Authority should not change
  const newAuthResp = resp[NEW_AUTHORITY.toString()];
  assertNoAccountChanges(newAuthResp?.before, newAuthResp?.after);

  // Metadata authority should have changed
  const metadataResp = resp[METADATA_ADDRESS.toString()];
  const metadataDecoder = getMetadataDecoder();
  const metadataBefore = metadataDecoder.decode(metadataResp.before.data);
  const metadataAfter = metadataDecoder.decode(metadataResp.after.data);
  assert.equal(
    metadataAfter.updateAuthority.toString(),
    NEW_AUTHORITY.toString()
  );

  // Other Metdata values should remain unchanged
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
