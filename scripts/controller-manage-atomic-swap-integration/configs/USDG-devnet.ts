import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { USDG_MINT, DEVNET_CONTROLLER, KEEL_DEPLOYER, DEVNET_PAYER, I64_MAX } from "../../../src";

export default {
  outputFile: "controller-manage-atomic-swap-integration-USDG-devnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: DEVNET_CONTROLLER,
  authority: KEEL_DEPLOYER,
  payer: DEVNET_PAYER,
  status: IntegrationStatus.Active,
  description: null, // null means no change
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: I64_MAX,
  oraclePriceInverted: false,
  inputTokenMint: USDG_MINT,
  outputTokenMint: USDG_MINT,
  oracle: "",
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

