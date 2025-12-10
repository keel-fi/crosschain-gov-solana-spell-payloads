import {
  KEEL_DEPLOYER,
  Network,
  SKY_LZ_GOVERNANCE_PROGRAM_ID,
  SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
  USDS_LZ_OFT_PROGRAM_DATA,
  USDS_LZ_OFT_STORE,
  SKY_LZ_GOVERNANCE_ACCOUNT,
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
    // NOTE: ntt-mainnet.so was downloaded with:
    // `solana program dump 43Ggis1nd29QdZFNXQAhhKKj3nxEtwN1DnbNiLf1VfEy ntt-mainnet.so -u m`
    // Dummy account.  TODO: Replace with actual program buffer.
    newProgramBuffer: "9g2VA38gRTvVvPXQPiUVcPH4HGPMVCRvax5HKVEaBLta",
    spillAccount: KEEL_DEPLOYER,
    payer: KEEL_DEPLOYER,
  },
};
