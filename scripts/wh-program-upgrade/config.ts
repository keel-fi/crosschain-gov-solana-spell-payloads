import {
  KEEL_DEPLOYER,
  Network,
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

export const NETWORK_CONFIGS: Record<Network, ProgramUpgrade> = {
  devnet: {
    governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
    programAddress: "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc",
    programDataAddress: "EsBqEQkFSsiRifBgQmtoXJheDJfYEMhgHSETn2MKgGV4",
    programUpgradeAuthority: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    newProgramBuffer: "9g2VA38gRTvVvPXQPiUVcPH4HGPMVCRvax5HKVEaBLta",
    spillAccount: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    payer: KEEL_DEPLOYER,
  },
  mainnet: {
    governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
    programAddress: USDS_WH_NTT_PROGRAM_ID,
    programDataAddress: USDS_WH_NTT_PROGRAM_DATA,
    programUpgradeAuthority: SKY_WH_GOVERNANCE_AUTHORITY,
    // NOTE: ntt-mainnet.so was downloaded with:
    // `solana program dump 43Ggis1nd29QdZFNXQAhhKKj3nxEtwN1DnbNiLf1VfEy ntt-mainnet.so -u m`
    newProgramBuffer: "43Ggis1nd29QdZFNXQAhhKKj3nxEtwN1DnbNiLf1VfEy",
    spillAccount: KEEL_DEPLOYER,
    payer: KEEL_DEPLOYER,
  },
};
