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
    dataProviderAuthority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
    payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  },
  // TODO [POST SSR ORACLE DEPLOY] update values
  mainnet: {
    oraclePda: "",
    dataProviderAuthority: "",
    payer: "",
  },
};
