import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  CASH_MINT,
} from "../../../src";

export default {
  outputFile: "controller-manage-atomic-swap-integration-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
  oraclePriceInverted: true, // Oracle has USDC as base_mint and CASH as quote_mint, so inverted
  inputTokenMint: CASH_MINT,
  outputTokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  oracle: "63MhziM5prCQkykzfciCuDo1iezd8tqQUHkK1nT7NWY",
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

