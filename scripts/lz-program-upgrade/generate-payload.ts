// Creates a payload for LZ governance to upgrade a program.
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToSolanaGovernancePayload,
  getUpgradeInstruction,
  readArgs,
  readConfigFromFile,
  writeOutputFile,
} from "../../src";
import { ACTION, ProgramUpgradeConfig } from "./config";

const generateUpgradeAuthorityPayload = () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ProgramUpgradeConfig>(args.config);

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

  writeOutputFile(config.outputFile, upgradeGovernancePayload);
};

generateUpgradeAuthorityPayload();
