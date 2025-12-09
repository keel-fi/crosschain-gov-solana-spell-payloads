import {
  KEEL_DEPLOYER,
  Network,
  SKY_LZ_GOVERNANCE_PROGRAM_ID,
  SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
  USDS_LZ_OFT_PROGRAM_DATA,
  USDS_LZ_OFT_STORE,
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
    // Program account owned by BPFLoaderUpgradeable (the OFT program itself)
    programAddress: "SKYTAiJRkgexqQqFoqhXdCANyfziwrVrzjhBaCzdbKW",
    // Program data account owned by BPFLoaderUpgradeable (contains the program code)
    programDataAddress: "3mEXzCiHywSPpSpqqfWz4iKuZJbDcmb98eg8ypDeuW5z",
    programUpgradeAuthority: SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
    // NOTE: ntt-mainnet.so was downloaded with:
    // `solana program dump 43Ggis1nd29QdZFNXQAhhKKj3nxEtwN1DnbNiLf1VfEy ntt-mainnet.so -u m`
    newProgramBuffer: "43Ggis1nd29QdZFNXQAhhKKj3nxEtwN1DnbNiLf1VfEy",
    spillAccount: KEEL_DEPLOYER,
    payer: KEEL_DEPLOYER,
  },
};
