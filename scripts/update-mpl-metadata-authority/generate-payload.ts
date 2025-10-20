import fs from "fs";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  convertKitInstructionToWeb3Js,
  readAndValidateNetworkConfig,
  readArgs,
  WH_OWNER_SENTINEL_KEY,
  WH_PAYER_SENTINEL_KEY,
  writeOutputFile,
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
import { ACTION, NETWORK_CONFIGS } from "./config";

const generatePayload = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  const addressCodec = getAddressCodec();
  const [metadataAddress] = await getProgramDerivedAddress({
    programAddress: address(config.mplProgramAddress),
    seeds: [
      "metadata",
      addressCodec.encode(address(config.mplProgramAddress)),
      addressCodec.encode(address(config.tokenMint)),
    ],
  });
  const instructionArgs = updateArgs("AsUpdateAuthorityV2", {
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
    authority: createNoopSigner(address(WH_OWNER_SENTINEL_KEY.toString())),
    metadata: metadataAddress,
    mint: address(config.tokenMint),
    payer: createNoopSigner(address(WH_PAYER_SENTINEL_KEY.toString())),
    updateArgs: instructionArgs,
  });
  const payload = convertInstructionToWhGovernanceSolanaPayload(
    new web3.PublicKey(config.governanceProgramId),
    convertKitInstructionToWeb3Js(kitInstruction)
  );

  writeOutputFile(args.file, payload);
};

generatePayload();
