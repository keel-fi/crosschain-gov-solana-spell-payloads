import {
  KEEL_DEPLOYER,
  Network,
  SKY_WH_GOVERNANCE_AUTHORITY,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
  USDS_LZ_OFT_STORE,
  USDS_TOKEN_MINT,
  USDS_WH_NTT_PROGRAM_ID,
} from "../../src";

export const ACTION = "ntt-transfer-mint-authority";

type NttTransferMintAuthority = {
  governanceProgramId: string;
  nttProgramId: string;
  authority: string;
  tokenMint: string;
  newMintAuthority: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, NttTransferMintAuthority> = {
  devnet: {
    governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
    nttProgramId: "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc",
    authority: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    tokenMint: "HUEf4eo1utbchf6ZVvLcVRtV9iEpsqLVrXAbPSdHXafj",
    newMintAuthority: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
    payer: KEEL_DEPLOYER,
  },
  mainnet: {
    governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
    nttProgramId: USDS_WH_NTT_PROGRAM_ID,
    authority: SKY_WH_GOVERNANCE_AUTHORITY,
    tokenMint: USDS_TOKEN_MINT,
    newMintAuthority: USDS_LZ_OFT_STORE,
    payer: KEEL_DEPLOYER,
  },
};
