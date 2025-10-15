import { Network, SKY_WH_GOVERNANCE_PROGRAM_ID } from "../../src";

type ProgramUpgrade = {
  governanceProgramId: string;
  programAddress: string;
  programDataAddress: string;
  programUpgradeAuthority: string;
  newProgramBuffer: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, ProgramUpgrade> = {
  devnet: {
    governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
    programAddress: "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc",
    programDataAddress: "EsBqEQkFSsiRifBgQmtoXJheDJfYEMhgHSETn2MKgGV4",
    programUpgradeAuthority: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    newProgramBuffer: "9g2VA38gRTvVvPXQPiUVcPH4HGPMVCRvax5HKVEaBLta",
    payer: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
  },
  mainnet: {
    governanceProgramId: "",
    programAddress: "",
    programDataAddress: "",
    programUpgradeAuthority: "",
    newProgramBuffer: "",
    payer: "",
  },
};
