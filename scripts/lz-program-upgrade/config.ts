import {
  KEEL_DEPLOYER,
  Network,
  SVM_ALM_CONTROLLER_PROGRAM_DATA,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  LZ_CPI_AUTHORITY_PLACEHOLDER,
} from "../../src";

export const ACTION = "lz-program-upgrade";

type ProgramUpgrade = {
  programAddress: string;
  programDataAddress: string;
  programUpgradeAuthority: string;
  newProgramBuffer: string;
  spillAccount: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, ProgramUpgrade> = {
  devnet: {
    programAddress: "",
    programDataAddress: "",
    programUpgradeAuthority: "",
    newProgramBuffer: "",
    spillAccount: "",
    payer: "",
  },
  mainnet: {
    programAddress: SVM_ALM_CONTROLLER_PROGRAM_ID,
    programDataAddress: SVM_ALM_CONTROLLER_PROGRAM_DATA,
    programUpgradeAuthority: LZ_CPI_AUTHORITY_PLACEHOLDER.toString(),
    // TODO: Replace with actual program buffer post audit
    newProgramBuffer: "",
    spillAccount: KEEL_DEPLOYER,
    payer: KEEL_DEPLOYER,
  },
  surfpool: {
    programAddress: SVM_ALM_CONTROLLER_PROGRAM_ID,
    programDataAddress: SVM_ALM_CONTROLLER_PROGRAM_DATA,
    programUpgradeAuthority: LZ_CPI_AUTHORITY_PLACEHOLDER.toString(),
    // TODO: Replace with actual program buffer post audit
    newProgramBuffer: "",
    spillAccount: KEEL_DEPLOYER,
    payer: KEEL_DEPLOYER,
  },
};
