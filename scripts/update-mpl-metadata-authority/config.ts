import {
  KEEL_DEPLOYER,
  MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
  Network,
  SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
  SKY_WH_GOVERNANCE_AUTHORITY,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
  USDS_TOKEN_MINT,
} from "../../src";

export const ACTION = "update-mpl-metadata-authority";

type UpdateMplTokenMetadataAuthority = {
  authority: string;
  governanceProgramId: string;
  mplProgramAddress: string;
  tokenMint: string;
  newAuthority: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, UpdateMplTokenMetadataAuthority> =
  {
    devnet: {
      authority: "",
      governanceProgramId: "",
      mplProgramAddress: "",
      tokenMint: "",
      newAuthority: "",
      payer: "",
    },
    mainnet: {
      authority: SKY_WH_GOVERNANCE_AUTHORITY,
      governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
      mplProgramAddress: MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
      tokenMint: USDS_TOKEN_MINT,
      newAuthority: SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
      payer: KEEL_DEPLOYER,
    },
  };
