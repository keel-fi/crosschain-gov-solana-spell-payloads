import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  PYUSD_MINT,
  USDC_MINT,
  I64_MAX,
} from "../../../src";

export default {
  outputFile: "controller-initialize-atomic-swap-integration-USDC-to-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
  status: IntegrationStatus.Active,
  description: "USDC->PYUSD AtomicSwap",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: I64_MAX,
  oraclePriceInverted: true,
  inputTokenMint: USDC_MINT,
  outputTokenMint: PYUSD_MINT,
  oracle: "EaUZnyqbcyHyJVy13aBhqd9k7NrsdDXzeD1VZnLNokid",
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

