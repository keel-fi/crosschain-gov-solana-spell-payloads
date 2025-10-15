// Creates a payload for WH governance to upgrade a program.
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  getUpgradeInstruction,
  readAndValidateNetworkConfig,
} from "../../src";
import { NETWORK_CONFIGS } from "./config";

const printSpellUpgradePayload = () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const upgradeInstruction = getUpgradeInstruction(
    new web3.PublicKey(config.programAddress),
    new web3.PublicKey(config.programDataAddress),
    new web3.PublicKey(config.newProgramBuffer),
    new web3.PublicKey(config.programUpgradeAuthority),
    // Use the authority as the "spill" account for
    // excess lamports
    new web3.PublicKey(config.programUpgradeAuthority)
  );

  const upgradeGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(
      new web3.PublicKey(config.governanceProgramId),
      upgradeInstruction
    );

  fs.writeFileSync(
    "output.json",
    JSON.stringify(upgradeGovernancePayload.toJSON().data)
  );

  console.log("Instruction Payload: ", upgradeGovernancePayload);
};

printSpellUpgradePayload();
