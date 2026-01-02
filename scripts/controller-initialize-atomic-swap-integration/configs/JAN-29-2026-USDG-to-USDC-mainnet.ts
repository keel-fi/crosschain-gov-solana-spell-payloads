import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import { I64_MAX, KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID, USDC_MINT, USDG_MINT, USDG_ORACLE_PDA } from "../../../src";

export default {
  outputFile: "controller-initialize-atomic-swap-integration-USDG-to-USDC-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER_2,
  status: IntegrationStatus.Active,
  description: "USDG->USDC AtomicSwap",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: I64_MAX,
  oraclePriceInverted: false,
  inputTokenMint: USDG_MINT,
  outputTokenMint: USDC_MINT,
  oracle: USDG_ORACLE_PDA,
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

