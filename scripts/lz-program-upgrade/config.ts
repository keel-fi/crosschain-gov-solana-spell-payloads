import {
  KEEL_DEPLOYER,
  Network,
  SKY_LZ_GOVERNANCE_PROGRAM_ID,
  SVM_ALM_CONTROLLER_PROGRAM_DATA,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
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
    programAddress: SVM_ALM_CONTROLLER_PROGRAM_ID,
    programDataAddress: SVM_ALM_CONTROLLER_PROGRAM_DATA,
    programUpgradeAuthority: KEEL_SUB_PROXY_CPI_AUTHORITY,
    // TODO: Replace with actual program buffer post audit
    newProgramBuffer: "",
    spillAccount: KEEL_DEPLOYER,
    payer: KEEL_DEPLOYER,
  },
};
