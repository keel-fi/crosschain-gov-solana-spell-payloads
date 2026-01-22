import {
  KEEL_DEPLOYER,
  SVM_ALM_CONTROLLER_PROGRAM_DATA,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
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

export const CONFIG: ProgramUpgrade = {
  programAddress: SVM_ALM_CONTROLLER_PROGRAM_ID,
  programDataAddress: SVM_ALM_CONTROLLER_PROGRAM_DATA,
  programUpgradeAuthority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  // TODO: Replace with actual program buffer post audit
  newProgramBuffer: "",
  spillAccount: KEEL_DEPLOYER,
  payer: KEEL_DEPLOYER,
};
