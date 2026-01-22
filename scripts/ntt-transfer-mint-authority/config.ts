import {
  KEEL_DEPLOYER,
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

export const CONFIG: NttTransferMintAuthority = {
  governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
  nttProgramId: USDS_WH_NTT_PROGRAM_ID,
  authority: SKY_WH_GOVERNANCE_AUTHORITY,
  tokenMint: USDS_TOKEN_MINT,
  newMintAuthority: USDS_LZ_OFT_STORE,
  payer: KEEL_DEPLOYER,
};
