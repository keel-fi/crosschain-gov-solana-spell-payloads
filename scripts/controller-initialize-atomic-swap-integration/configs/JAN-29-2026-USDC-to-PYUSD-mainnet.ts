import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import { I64_MAX, KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, PYUSD_MINT, PYUSD_ORACLE_PDA, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID, USDC_MINT } from "../../../src";

export default {
  outputFile: "controller-initialize-atomic-swap-integration-USDC-to-PYUSD-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER_2,
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
  oracle: PYUSD_ORACLE_PDA,
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

