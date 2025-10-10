import fs from "fs";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  convertKitInstructionToWeb3Js,
  SKY_WH_GOVERNANCE_AUTHORITY,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
  USDS_TOKEN_MINT,
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

// TODO update with LZ Governance Authority
const NEW_AUTHORITY = address("3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr");

const generatePayload = async () => {
  const addressCodec = getAddressCodec();
  const [METADATA] = await getProgramDerivedAddress({
    programAddress: MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
    seeds: [
      "metadata",
      addressCodec.encode(MPL_TOKEN_METADATA_PROGRAM_ADDRESS),
      USDS_TOKEN_MINT.toBuffer(),
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
    authority: createNoopSigner(
      address(SKY_WH_GOVERNANCE_AUTHORITY.toString())
    ),
    metadata: METADATA,
    mint: address(USDS_TOKEN_MINT.toString()),
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
