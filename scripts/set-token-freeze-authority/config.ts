import {
  KEEL_DEPLOYER,
  Network,
  SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
  SKY_WH_GOVERNANCE_AUTHORITY,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
  USDS_TOKEN_MINT,
} from "../../src";

export const ACTION = "set-token-freeze-authority";

type SetFreezeTokenAuthority = {
  governanceProgramId: string;
  authority: string;
  tokenMint: string;
  newFreezeAuthority: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, SetFreezeTokenAuthority> = {
  devnet: {
    governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
    authority: "5h5TjxxZRoD2rtLkqCtt4uTmFVXjsdpEydqa2B5TZJVU",
    tokenMint: "C71h4tuPk6f72bAM2D8L2nwH3XtJB6awsw7H6xmNDo3E",
    newFreezeAuthority: "JDNDBYaXdNiD7peLgRP3TZKwkeCJ3QEFwYkHk6DWbb75",
    payer: KEEL_DEPLOYER,
  },
  mainnet: {
    governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
    authority: SKY_WH_GOVERNANCE_AUTHORITY,
    tokenMint: USDS_TOKEN_MINT,
    newFreezeAuthority: SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
    payer: KEEL_DEPLOYER,
  },
};
