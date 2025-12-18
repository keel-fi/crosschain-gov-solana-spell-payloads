// Creates a payload for LZ governance to upgrade a program.
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToSolanaGovernancePayload,
  getUpgradeInstruction,
  readAndValidateNetworkConfig,
  readArgs,
  LZ_CPI_AUTHORITY_PLACEHOLDER,
  writeOutputFile,
} from "../../src";
import { ACTION, NETWORK_CONFIGS } from "./config";

const generateUpgradeAuthorityPayload = () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  const upgradeInstruction = getUpgradeInstruction(
    new web3.PublicKey(config.programAddress),
    new web3.PublicKey(config.programDataAddress),
    new web3.PublicKey(config.newProgramBuffer),
    new web3.PublicKey(config.programUpgradeAuthority),
    // Use the authority as the "spill" account for
    // excess lamports
    new web3.PublicKey(config.spillAccount)
  );

  const upgradeGovernancePayload =
    convertInstructionToSolanaGovernancePayload(upgradeInstruction);

  writeOutputFile(args.file, upgradeGovernancePayload);
};

generateUpgradeAuthorityPayload();
