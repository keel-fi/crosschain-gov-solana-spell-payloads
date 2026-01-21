import { web3 } from "@coral-xyz/anchor";

export const USDS_TOKEN_MINT = "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA";

/* Pre migration constants */
/** Canonical Sky WH Governance program */
export const SKY_WH_GOVERNANCE_PROGRAM_ID =
  "SCCGgsntaUPmP6UjwUBNiQQ83ys5fnCHdFASHPV6Fm9";
export const SKY_WH_GOVERNANCE_AUTHORITY =
  "66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj";
export const USDS_WH_NTT_PROGRAM_ID =
  "STTUVCMPuNbk21y1J6nqEGXSQ8HKvFmFBKnCvKHTrWn";
export const USDS_WH_NTT_PROGRAM_DATA =
  "CKKGtQ2m1t4gHUz2tECGQNqaaFtGsoc9eBjzm61qqV2Q";
export const USDS_WH_NTT_MINT_AUTHORITY =
  "Bjui9tuxKGsiF5FDwosfUsRUXg9RZCKidbThfm6CRtRt";

/* Post migration constants */
export const SKY_LZ_GOVERNANCE_PROGRAM_ID =
  "SKYGRikJcGSa3jC5HDyzDrVsmkCk3e5SqAurycny8PW";
export const SKY_LZ_GOVERNANCE_ACCOUNT =
  "8vXXGiaXFrKFUDw21H5Z57ex552Lh8WP9rVd2ktzmcCy";
export const SKY_LZ_GOVERNANCE_CPI_AUTHORITY =
  "AYPtjx4Hc8us1ikULUedkmZ3wtiD6tmL7gK3qe4V3oHt";

// USDS' OFT mint authority
export const USDS_LZ_OFT_STORE = "BEvTHkTyXooyaJzP8egDUC7WQK8cyRrq5WvERZNWhuah";

/* Other constants */
export const KEEL_DEPLOYER = "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2";

export const SVM_ALM_CONTROLLER_PROGRAM_ID =
  "ALM1JSnEhc5PkNecbSZotgprBuJujL5objTbwGtpTgTd";

export const SVM_ALM_CONTROLLER =
  "EeobZr57FSmNvw8Hs719iULJNqv3XLrTB5uPezvC2ND3";

export const KEEL_SUB_PROXY_CPI_AUTHORITY =
  "FDFsoboECfazAq1eLvwBLZXhoxjPvTy4wCzPdbqnk7Zk";

export const SVM_ALM_CONTROLLER_PROGRAM_DATA =
  "93qn8rcvZPXGaHmetHrPEd6E5KuzGYEDV7bBgiyC31zj";

export const BPF_LOADER_PROGRAM_ID =
  "BPFLoaderUpgradeab1e11111111111111111111111";

export const USDG_MINT = "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH"; // link: https://explorer.solana.com/address/2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH
export const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"; // link: https://explorer.solana.com/address/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo
export const CASH_MINT = "CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH"; // link: https://explorer.solana.com/address/CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // link: https://explorer.solana.com/address/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

export const CASH_ORACLE_PDA = "H8uoMnbTruerEj2twgd7CjFydupvcGoK97LEJeHvkE8N";
export const PYUSD_ORACLE_PDA = "EaUZnyqbcyHyJVy13aBhqd9k7NrsdDXzeD1VZnLNokid";
export const USDG_ORACLE_PDA = "2XBgvU8h95BxHMFFenKBdHir4XeXrnx5nirGrLjPm8EJ";

export const KAMINO_MAIN_MARKET = "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"; // link: https://explorer.solana.com/address/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
export const KAMINO_CASH_RESERVE = "ApQkX32ULJUzszZDe986aobLDLMNDoGQK8tRm6oD6SsA"; // link: https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/ApQkX32ULJUzszZDe986aobLDLMNDoGQK8tRm6oD6SsA
export const KAMINO_CASH_FARM_COLLATERAL = "8pkQoRJz4yKVpYLjqFNdNfN1mvkDQz4UHRtJenzS9yys"; // Farm collateral field in the Anchor Data tab: https://explorer.solana.com/address/ApQkX32ULJUzszZDe986aobLDLMNDoGQK8tRm6oD6SsA/anchor-account
export const KAMINO_PYUSD_RESERVE = "2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN"; // https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN
export const KAMINO_PYUSD_FARM_COLLATERAL = "DEe2NZ5dAXGxC7M8Gs9Esd9wZRPdQzG8jNamXqhL5yku"; // Farm collateral field in the Anchor Data tab: https://explorer.solana.com/address/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN/anchor-account
export const KAMINO_USDG_RESERVE = "ESCkPWKHmgNE7Msf77n9yzqJd5kQVWWGy3o5Mgxhvavp"; // link: https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/ESCkPWKHmgNE7Msf77n9yzqJd5kQVWWGy3o5Mgxhvavp
export const KAMINO_USDG_FARM_COLLATERAL = "3W4tNzMoRXCBhirSSoHf5413Cx9P8kqXk4QpZtkjiLCG"; // Farm collateral field in the Anchor Data tab: https://explorer.solana.com/address/ESCkPWKHmgNE7Msf77n9yzqJd5kQVWWGy3o5Mgxhvavp/anchor-account

export const DRIFT_POOL_ID = 0;
export const DRIFT_CASH_SPOT_MARKET_INDEX = 61; // link: https://github.com/drift-labs/protocol-v2/blob/024db6abba2bcefb0e9f494a2d4f42a8337f8ae9/sdk/src/constants/spotMarkets.ts#L998
export const DRIFT_PYUSD_SPOT_MARKET_INDEX = 22; // link: https://github.com/drift-labs/protocol-v2/blob/024db6abba2bcefb0e9f494a2d4f42a8337f8ae9/sdk/src/constants/spotMarkets.ts#L509

export const I64_MAX = 2n ** 63n - 1n; // i64::MAX

export const MAINNET_PAYER = "2rRM7kWjWjS7CGoRnSHTMu4daS24YAA9BgcP1qo2v1UC";

export const SURFPOOL_URL = "http://127.0.0.1:8899";

/* Token mints */
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

/* Oracle addresses */
export const USDC_TO_USDT_ORACLE =
  "E6QFLWgPoDHydKVwEc5Ar49k1zMQ19qM8A9NFxjoSitn";

export const KAMINO_USDC_RESERVE =
  "D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59";

// Integration PDA addresses (hardcoded)
// Atomic Swap Integrations
export const ATOMIC_SWAP_CASH_TO_USDC_INTEGRATION = "Ccra5MR5aoxTnUK1hYSGBhCHJQ8FUGzg13Lr8JaULs5e"
export const ATOMIC_SWAP_USDC_TO_USDT_INTEGRATION = "Efy1EWHmJzckFqpAbDzxnsMXwBu5Jf13BMXXf2fMUUcs"
export const ATOMIC_SWAP_PYUSD_TO_USDC_INTEGRATION = "B7NzceNVVEqbNrDJhDmgVnUnJPMaNS3ihM8Ycv3D8Dg9"
export const ATOMIC_SWAP_USDG_TO_USDC_INTEGRATION = "8a32LthhDseXiDMAAPJ6pH2mgKGJxWvtYMKqPUdXZ9z1"

// Kamino Integrations
export const KAMINO_CASH_INTEGRATION = "2WwcSKqA9DE1SJB6w7HNBWTqbxsJZorzzME1jRG5xpEX"
export const KAMINO_PYUSD_INTEGRATION = "9DULRsF4Cfj2BbYZp9n6deLf16yYnR5EcFicvzLNMC2s"
export const KAMINO_USDC_INTEGRATION = "GZ6vUcBZk4QiaBUhhn1TpX6S7FiXK71Pogke1RnBc3zA"
export const KAMINO_USDG_INTEGRATION = "5JYk4vbZTFcBiHK5HzQTmYcT6kosEKJV62tYTCTpT6xy"

// Drift Integrations
export const DRIFT_CASH_INTEGRATION = "3i99KS1PRkVArW1LTTGzVKTkXZ2yEyCA8fMYhH4YZKQo"
export const DRIFT_PYUSD_INTEGRATION = "5rqJu2NrbMBnW2B2mejSPUV589gb7pvHSGrWQyQqnQz5"
export const DRIFT_USDC_INTEGRATION = "ET3k7uBeXLmeVQW5Tm8xBnLte9FgUSRebgneT57wjuqL"

// LayerZero configuration constants
export namespace LayerZeroConfig {
  // LayerZero Solana Endpoint ID
  export const SOLANA_ENDPOINT_ID = 30168;

  // Ethereum chain endpoint ID
  export const ETHEREUM_ENDPOINT_ID = 30101;

  // LayerZero V2 Endpoint Program on Solana mainnet
  export const LAYERZERO_ENDPOINT_PROGRAM = new web3.PublicKey(
    "76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6"
  );

  // Memo program for cross-chain text messages
  export const MEMO_PROGRAM = new web3.PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );

  // Noop program for no-operation cross-chain instructions
  export const NOOP_PROGRAM = new web3.PublicKey(
    "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"
  );

  // LayerZero account seeds
  export const OAPP_SEED = Buffer.from("OApp");
  export const NONCE_SEED = Buffer.from("Nonce");
  export const PAYLOAD_HASH_SEED = Buffer.from("PayloadHash");
  export const ENDPOINT_SEED = Buffer.from("Endpoint");

  // Message type for governance transactions
  export const SEND_TX_TYPE = 1;
}

// Ethereum contract addresses
export namespace EthereumAddresses {
  // L1 Governance Relay contract address
  export const L1_GOVERNANCE_RELAY =
    "0x2beBFe397D497b66cB14461cB6ee467b4C3B7D61";

  // Governance OApp Sender contract address
  export const GOVERNANCE_OAPP_SENDER =
    "0x27FC1DD771817b53bE48Dc28789533BEa53C9CCA";

  // LayerZero Endpoint v2 address
  export const LAYERZERO_ENDPOINT_V2 =
    "0x1a44076050125825900e736c501f859c50fE728c";

  export const KEEL_PROXY = "0x355CD90Ecb1b409Fdf8b64c4473C3B858dA2c310";
}
