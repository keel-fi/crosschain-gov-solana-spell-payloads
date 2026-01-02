import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { DEVNET_CONTROLLER, DEVNET_PAYER, I64_MAX, KEEL_DEPLOYER, USDG_MINT } from "../../../src";

export default {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: DEVNET_CONTROLLER,
  authority: KEEL_DEPLOYER,
  payer: DEVNET_PAYER,
  status: IntegrationStatus.Active,
  description: "Atomic Swap for USDG",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
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

