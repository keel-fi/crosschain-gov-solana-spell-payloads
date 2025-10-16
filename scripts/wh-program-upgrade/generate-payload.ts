// Creates a payload for WH governance to upgrade a program.
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  getUpgradeInstruction,
  readAndValidateNetworkConfig,
  readArgs,
  WH_OWNER_SENTINEL_KEY,
  writeOutputFile,
} from "../../src";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printSpellUpgradePayload = () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  const upgradeInstruction = getUpgradeInstruction(
    new web3.PublicKey(config.programAddress),
    new web3.PublicKey(config.programDataAddress),
    new web3.PublicKey(config.newProgramBuffer),
    WH_OWNER_SENTINEL_KEY,
    // Use the authority as the "spill" account for
    // excess lamports
    new web3.PublicKey(config.spillAccount)
  );

  const upgradeGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(
      new web3.PublicKey(config.governanceProgramId),
      upgradeInstruction
    );

  writeOutputFile(args.file, upgradeGovernancePayload);
};

printSpellUpgradePayload();
