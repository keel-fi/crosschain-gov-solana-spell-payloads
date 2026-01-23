import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  PYUSD_MINT,
  USDC_MINT,
  I64_MAX,
  PYUSD_ORACLE_PDA,
  MAINNET_PAYER,
} from "../../../src";

export default {
  outputFile: "controller-initialize-atomic-swap-integration-PYUSD-to-USDC-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  payer: MAINNET_PAYER,
  status: IntegrationStatus.Active,
  description: "PYUSD->USDC AtomicSwap",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: I64_MAX,
  oraclePriceInverted: false,
  inputTokenMint: PYUSD_MINT,
  outputTokenMint: USDC_MINT,
  oracle: PYUSD_ORACLE_PDA,
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

