import {
  MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
  Network,
  SKY_WH_GOVERNANCE_AUTHORITY,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
  USDS_TOKEN_MINT,
} from "../../src";

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
      // TODO [POST LZ GOV OAPP DEPLOY] update the newAuthority to
      // oapp governance authority.
      newAuthority: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      payer: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
    },
  };
