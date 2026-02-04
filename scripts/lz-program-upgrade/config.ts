export const ACTION = "lz-program-upgrade";

export type ProgramUpgradeConfig = {
  outputFile: string;
  programAddress: string;
  programDataAddress: string;
  programUpgradeAuthority: string;
  newProgramBuffer: string;
  spillAccount: string;
  payer: string;
};
