// Creates a payload for LZ governance to upgrade a program.
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToSolanaGovernancePayload,
  getUpgradeInstruction,
  readArgs,
  writeOutputFile,
} from "../../src";
import { ACTION, CONFIG } from "./config";

const generateUpgradeAuthorityPayload = () => {
  const args = readArgs(ACTION);
  const upgradeInstruction = getUpgradeInstruction(
    new web3.PublicKey(CONFIG.programAddress),
    new web3.PublicKey(CONFIG.programDataAddress),
    new web3.PublicKey(CONFIG.newProgramBuffer),
    new web3.PublicKey(CONFIG.programUpgradeAuthority),
    // Use the authority as the "spill" account for
    // excess lamports
    new web3.PublicKey(CONFIG.spillAccount)
  );

  const upgradeGovernancePayload =
    convertInstructionToSolanaGovernancePayload(upgradeInstruction);

  writeOutputFile(args.file, upgradeGovernancePayload);
};

generateUpgradeAuthorityPayload();
