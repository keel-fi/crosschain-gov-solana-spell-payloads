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
  readArgs,
  WH_OWNER_SENTINEL_KEY,
  writeOutputFile,
} from "../../src";
import { ACTION, NETWORK_CONFIGS } from "./config";

const generatePayload = () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  const setAuthorityInstruction = createSetAuthorityInstruction(
    new web3.PublicKey(config.tokenMint),
    WH_OWNER_SENTINEL_KEY,
    AuthorityType.FreezeAccount,
    new web3.PublicKey(config.newFreezeAuthority),
    [],
    TOKEN_PROGRAM_ID
  );

  const payload = convertInstructionToWhGovernanceSolanaPayload(
    new web3.PublicKey(config.governanceProgramId),
    setAuthorityInstruction
  );

  writeOutputFile(args.file, payload);
};

generatePayload();
