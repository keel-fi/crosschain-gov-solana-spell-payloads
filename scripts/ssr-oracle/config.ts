import { Network } from "../../src";

export const ACTION = "ssr-oracle";

type SsrOracle = {
  oraclePda: string;
  payer: string;
};

export const NETWORK_CONFIGS: Record<Network, SsrOracle> = {
  devnet: {
    oraclePda: "675PeyDo2QAWXP1pX4zUe3f3PX1n5JnwhwP4JyH8EAF6",
    payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  },
  // TODO [POST CONTROLLER DEPLOY] update controller, authority, superAuthority
  mainnet: {
    oraclePda: "",
    payer: "",
  },
};
