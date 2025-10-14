// Creates a payload for WH governance to upgrade a program.
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  getUpgradeInstruction,
  Network,
  readAndValidateNetworkConfig,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
} from "../../src";

type ProgramUpgrade = {
  programAddress: string;
  programDataAddress: string;
  programUpgradeAuthority: string;
  newProgramBuffer: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, ProgramUpgrade> = {
  devnet: {
    programAddress: "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc",
    programDataAddress: "EsBqEQkFSsiRifBgQmtoXJheDJfYEMhgHSETn2MKgGV4",
    programUpgradeAuthority: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    newProgramBuffer: "9g2VA38gRTvVvPXQPiUVcPH4HGPMVCRvax5HKVEaBLta",
    payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  },
  mainnet: {
    programAddress: "",
    programDataAddress: "",
    programUpgradeAuthority: "",
    newProgramBuffer: "",
    payer: "",
  },
};

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
      SKY_WH_GOVERNANCE_PROGRAM_ID,
      upgradeInstruction
    );

  fs.writeFileSync(
    "output.json",
    JSON.stringify(upgradeGovernancePayload.toJSON().data)
  );

  console.log("Upgrade Instruction Payload: ", upgradeGovernancePayload);
};

printSpellUpgradePayload();
