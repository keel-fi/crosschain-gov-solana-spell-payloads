import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDC_MINT,
} from "../../../src";

export default {
  outputFile: "controller-manage-atomic-swap-integration-USDC-to-USDT-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: "2rRM7kWjWjS7CGoRnSHTMu4daS24YAA9BgcP1qo2v1UC",
  status: IntegrationStatus.Active,
  description: "USDC->USDT AtomicSwap",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
  oraclePriceInverted: true, // Oracle has USDC as base_mint and CASH as quote_mint, so inverted
  inputTokenMint: USDC_MINT,
  outputTokenMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  oracle: "E6QFLWgPoDHydKVwEc5Ar49k1zMQ19qM8A9NFxjoSitn",
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

