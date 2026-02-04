import {
  KEEL_DEPLOYER,
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

export const CONFIG: SetFreezeTokenAuthority = {
  governanceProgramId: SKY_WH_GOVERNANCE_PROGRAM_ID,
  authority: SKY_WH_GOVERNANCE_AUTHORITY,
  tokenMint: USDS_TOKEN_MINT,
  newFreezeAuthority: SKY_LZ_GOVERNANCE_CPI_AUTHORITY,
  payer: KEEL_DEPLOYER,
};
