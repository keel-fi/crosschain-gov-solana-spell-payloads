import { Network } from "../../src";

export const ACTION = "ssr-oracle";

type SsrOracle = {
  oraclePda: string;
  dataProviderAuthority: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, SsrOracle> = {
  devnet: {
    oraclePda: "675PeyDo2QAWXP1pX4zUe3f3PX1n5JnwhwP4JyH8EAF6",
    dataProviderAuthority: "7hAnDARg8LzUMS3uU7aTTei3C7sSnBMzGE6u8Mbve9EP",
    payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  },
  // TODO [POST SSR ORACLE DEPLOY] update values
  mainnet: {
    oraclePda: "",
    dataProviderAuthority: "",
    payer: "",
  },
};
