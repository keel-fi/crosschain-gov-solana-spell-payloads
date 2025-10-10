import fs from "fs";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  convertKitInstructionToWeb3Js,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
  WH_PAYER_SENTINEL_KEY,
} from "../../src";
import {
  MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
  collectionDetailsToggle,
  collectionToggle,
  getUpdateInstruction,
  ruleSetToggle,
  updateArgs,
  usesToggle,
} from "../../src/programs/metaplex-token-metadata";
import {
  address,
  createNoopSigner,
  getAddressCodec,
  getProgramDerivedAddress,
} from "@solana/kit";

// WH governance authority
const CURRENT_AUTHORITY = address(
  "66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj"
);
const TOKEN_MINT = address("USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA");
// TODO update with LZ Governance Authority
const NEW_AUTHORITY = address(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);

const generatePayload = async () => {
  const addressCodec = getAddressCodec();
  const [METADATA] = await getProgramDerivedAddress({
    programAddress: MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
    seeds: [
      "metadata",
      addressCodec.encode(MPL_TOKEN_METADATA_PROGRAM_ADDRESS),
      addressCodec.encode(TOKEN_MINT),
    ],
  });
  const args = updateArgs("AsUpdateAuthorityV2", {
    newUpdateAuthority: NEW_AUTHORITY,
    data: null,
    primarySaleHappened: null,
    isMutable: null,
    collection: collectionToggle("None"),
    collectionDetails: collectionDetailsToggle("None"),
    uses: usesToggle("None"),
    ruleSet: ruleSetToggle("None"),
    tokenStandard: null,
    authorizationData: null,
  });
  const kitInstruction = getUpdateInstruction({
    authority: createNoopSigner(CURRENT_AUTHORITY),
    metadata: METADATA,
    mint: TOKEN_MINT,
    payer: createNoopSigner(address(WH_PAYER_SENTINEL_KEY.toString())),
    updateArgs: args,
  });
  const payload = convertInstructionToWhGovernanceSolanaPayload(
    SKY_WH_GOVERNANCE_PROGRAM_ID,
    convertKitInstructionToWeb3Js(kitInstruction)
  );

  fs.writeFileSync("output.json", JSON.stringify(payload.toJSON().data));

  console.log("Instruction Payload: ", payload);
};

generatePayload();
