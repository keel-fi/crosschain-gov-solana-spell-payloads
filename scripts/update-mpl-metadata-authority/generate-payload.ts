import fs from "fs";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  convertKitInstructionToWeb3Js,
  readAndValidateNetworkConfig,
  WH_PAYER_SENTINEL_KEY,
} from "../../src";
import {
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
import { web3 } from "@coral-xyz/anchor";
import { NETWORK_CONFIGS } from "./config";

const generatePayload = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const addressCodec = getAddressCodec();
  const [metadataAddress] = await getProgramDerivedAddress({
    programAddress: address(config.mplProgramAddress),
    seeds: [
      "metadata",
      addressCodec.encode(address(config.mplProgramAddress)),
      addressCodec.encode(address(config.tokenMint)),
    ],
  });
  const args = updateArgs("AsUpdateAuthorityV2", {
    newUpdateAuthority: address(config.newAuthority),
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
    authority: createNoopSigner(address(config.authority)),
    metadata: metadataAddress,
    mint: address(config.tokenMint),
    payer: createNoopSigner(address(WH_PAYER_SENTINEL_KEY.toString())),
    updateArgs: args,
  });
  const payload = convertInstructionToWhGovernanceSolanaPayload(
    new web3.PublicKey(config.governanceProgramId),
    convertKitInstructionToWeb3Js(kitInstruction)
  );

  fs.writeFileSync("output.json", JSON.stringify(payload.toJSON().data));

  console.log("Instruction Payload: ", payload);
};

generatePayload();
