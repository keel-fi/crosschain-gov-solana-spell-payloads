import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  CASH_MINT,
  MAINNET_PAYER,
  USDC_MINT,
  CASH_ORACLE_PDA,
  I64_MAX,
} from "../../../src";

export default {
  outputFile: "controller-manage-atomic-swap-integration-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: I64_MAX,
  oraclePriceInverted: true, // Oracle has USDC as base_mint and CASH as quote_mint, so inverted
  inputTokenMint: CASH_MINT,
  outputTokenMint: USDC_MINT,
  oracle: CASH_ORACLE_PDA,
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

