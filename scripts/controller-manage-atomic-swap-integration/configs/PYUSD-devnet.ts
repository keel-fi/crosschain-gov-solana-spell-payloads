import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { USDG_MINT } from "../../../src";

export default {
  outputFile: "controller-manage-atomic-swap-integration-PYUSD-devnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
  authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
  payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  status: IntegrationStatus.Active,
  description: null,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  maxSlippageBps: 10,
  maxStaleness: 100n,
  expiryTimestamp: 2n ** 63n - 1n, // i64::MAX
  oraclePriceInverted: false,
  inputTokenMint: USDG_MINT,
  outputTokenMint: USDG_MINT,
  oracle: "",
  inputMintDecimals: 6,
  outputMintDecimals: 6,
};

