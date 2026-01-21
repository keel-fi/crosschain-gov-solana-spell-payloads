// Creates a payload for WH governance to upgrade a program.
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhSolanaGovernancePayload,
  getUpgradeInstruction,
  readArgs,
  WH_OWNER_SENTINEL_KEY,
  writeOutputFile,
} from "../../src";
import { ACTION, CONFIG } from "./config";

const generateUpgradeAuthorityPayload = () => {
  const args = readArgs(ACTION);
  const upgradeInstruction = getUpgradeInstruction(
    new web3.PublicKey(CONFIG.programAddress),
    new web3.PublicKey(CONFIG.programDataAddress),
    new web3.PublicKey(CONFIG.newProgramBuffer),
    WH_OWNER_SENTINEL_KEY,
    // Use the authority as the "spill" account for
    // excess lamports
    new web3.PublicKey(CONFIG.spillAccount)
  );

  const upgradeGovernancePayload =
    convertInstructionToWhSolanaGovernancePayload(
      new web3.PublicKey(CONFIG.governanceProgramId),
      upgradeInstruction
    );

  writeOutputFile(args.file, upgradeGovernancePayload);
};

generateUpgradeAuthorityPayload();
