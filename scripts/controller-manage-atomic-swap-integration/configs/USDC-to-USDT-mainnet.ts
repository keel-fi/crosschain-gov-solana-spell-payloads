import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDC_MINT,
  MAINNET_PAYER,
  USDT_MINT,
  USDC_TO_USDT_ORACLE,
  I64_MAX,
} from "../../../src";

export default {
  outputFile: "controller-manage-atomic-swap-integration-USDC-to-USDT-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: "USDC->USDT AtomicSwap",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: I64_MAX,
  oraclePriceInverted: true,
  inputTokenMint: USDC_MINT,
  outputTokenMint: USDT_MINT,
  oracle: USDC_TO_USDT_ORACLE,
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

