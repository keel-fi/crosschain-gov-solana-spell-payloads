import {
  KEEL_DEPLOYER,
  Network,
  SKY_LZ_GOVERNANCE_PROGRAM_ID,
} from "../../src";

export const ACTION = "lz-program-upgrade";

type ProgramUpgrade = {
  governanceProgramId: string;
  programAddress: string;
  programDataAddress: string;
  programUpgradeAuthority: string;
  newProgramBuffer: string;
  spillAccount: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, ProgramUpgrade> = {
  devnet: {
    governanceProgramId: "",
    programAddress: "",
    programDataAddress: "",
    programUpgradeAuthority: "",
    newProgramBuffer: "",
    spillAccount: "",
    payer: "",
  },
  mainnet: {
    governanceProgramId: SKY_LZ_GOVERNANCE_PROGRAM_ID,
    programAddress: "ALM1JSnEhc5PkNecbSZotgprBuJujL5objTbwGtpTgTd",
    programDataAddress: "93qn8rcvZPXGaHmetHrPEd6E5KuzGYEDV7bBgiyC31zj",
    programUpgradeAuthority: "FDFsoboECfazAq1eLvwBLZXhoxjPvTy4wCzPdbqnk7Zk",
    // Dummy account.  TODO: Replace with actual program buffer.
    newProgramBuffer: "5tBFpZxv7JA1fwikZftymiMuUopZo3hXPyS5NrKYQvDF",
    spillAccount: KEEL_DEPLOYER,
    payer: KEEL_DEPLOYER,
  },
};
