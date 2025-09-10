import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  getUpgradeInstruction,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
} from "../src";
// Creates a payload for upgrading the Solana NTT Manager program.

// TODO get values and verify correctness
const NTT_MANAGER_ADDRESS = new web3.PublicKey(
  "STTUVCMPuNbk21y1J6nqEGXSQ8HKvFmFBKnCvKHTrWn"
);
const NTT_MANAGER_PROGRAM_DATA_ADDRESS = new web3.PublicKey(
  "CKKGtQ2m1t4gHUz2tECGQNqaaFtGsoc9eBjzm61qqV2Q"
);
const NTT_MANAGER_UPGRADE_AUTHORITY = new web3.PublicKey(
  "66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj"
);
const NEW_PROGRAM_BUFFER = new web3.PublicKey("TODO");
const printSpell0NttUpgradePayload = () => {
  const upgradeInstruction = getUpgradeInstruction(
    NTT_MANAGER_ADDRESS,
    NTT_MANAGER_PROGRAM_DATA_ADDRESS,
    NEW_PROGRAM_BUFFER,
    NTT_MANAGER_UPGRADE_AUTHORITY,
    // Use the authority as the "spill" account for
    // excess lamports
    NTT_MANAGER_UPGRADE_AUTHORITY
  );
  const upgradeGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(
      SKY_WH_GOVERNANCE_PROGRAM_ID,
      upgradeInstruction
    );
  console.log("Upgrade Instruction Payload: ", upgradeGovernancePayload);
};

printSpell0NttUpgradePayload();
