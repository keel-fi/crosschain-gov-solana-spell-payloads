import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  AuthorityType,
  TOKEN_PROGRAM_ID,
  createSetAuthorityInstruction,
} from "@solana/spl-token";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  readAndValidateNetworkConfig,
  WH_OWNER_SENTINEL_KEY,
} from "../../src";
import { NETWORK_CONFIGS } from "./config";

const generateSetTokenAuthorityPayload = () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const setAuthorityInstruction = createSetAuthorityInstruction(
    new web3.PublicKey(config.tokenMint),
    WH_OWNER_SENTINEL_KEY,
    AuthorityType.FreezeAccount,
    new web3.PublicKey(config.newAuthority),
    [],
    TOKEN_PROGRAM_ID
  );

  const payload = convertInstructionToWhGovernanceSolanaPayload(
    new web3.PublicKey(config.governanceProgramId),
    setAuthorityInstruction
  );

  fs.writeFileSync("output.json", JSON.stringify(payload.toJSON().data));

  console.log("Instruction Payload: ", payload);
};

generateSetTokenAuthorityPayload();
