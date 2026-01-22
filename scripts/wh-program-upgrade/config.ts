import {
  KEEL_DEPLOYER,
  SKY_WH_GOVERNANCE_AUTHORITY,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
  USDS_WH_NTT_PROGRAM_DATA,
  USDS_WH_NTT_PROGRAM_ID,
} from "../../src";

export const ACTION = "wh-program-upgrade";

type ProgramUpgrade = {
  governanceProgramId: string;
  programAddress: string;
  programDataAddress: string;
  programUpgradeAuthority: string;
  newProgramBuffer: string;
  spillAccount: string;
  payer: string;
};

export const CONFIG: ProgramUpgrade = {
  governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
  programAddress: USDS_WH_NTT_PROGRAM_ID,
  programDataAddress: USDS_WH_NTT_PROGRAM_DATA,
  programUpgradeAuthority: SKY_WH_GOVERNANCE_AUTHORITY,
  // NOTE: ntt-mainnet.so was downloaded with:
  // `solana program dump 43Ggis1nd29QdZFNXQAhhKKj3nxEtwN1DnbNiLf1VfEy ntt-mainnet.so -u m`
  newProgramBuffer: "43Ggis1nd29QdZFNXQAhhKKj3nxEtwN1DnbNiLf1VfEy",
  spillAccount: KEEL_DEPLOYER,
  payer: KEEL_DEPLOYER,
};
