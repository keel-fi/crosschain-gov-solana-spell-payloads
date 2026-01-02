import { IntegrationStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  PYUSD_MINT,
} from "../../../src";

export default {
  outputFile: "controller-manage-atomic-swap-integration-PYUSD-mainnet.txt",
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
  oraclePriceInverted: false,
  inputTokenMint: PYUSD_MINT,
  outputTokenMint: "",
  oracle: "",
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

