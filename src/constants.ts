import { web3 } from "@coral-xyz/anchor";

export const USDS_TOKEN_MINT = new web3.PublicKey(
  "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"
);
/* Pre migration constants */
/** Canonical Sky WH Governance program */
export const SKY_WH_GOVERNANCE_PROGRAM_ID = new web3.PublicKey(
  "SCCGgsntaUPmP6UjwUBNiQQ83ys5fnCHdFASHPV6Fm9"
);
export const SKY_WH_GOVERNANCE_AUTHORITY = new web3.PublicKey(
  "66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj"
);
export const USDS_WH_NTT_PROGRAM_ID = new web3.PublicKey(
  "STTUVCMPuNbk21y1J6nqEGXSQ8HKvFmFBKnCvKHTrWn"
);
export const USDS_WH_NTT_MINT_AUTHORITY = new web3.PublicKey(
  "Bjui9tuxKGsiF5FDwosfUsRUXg9RZCKidbThfm6CRtRt"
);
/* Post migration constants */
// TODO add LZ related constants when available