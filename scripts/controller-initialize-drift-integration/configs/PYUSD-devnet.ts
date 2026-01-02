import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { PYUSD_MINT } from "../../../src";

export default {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
  authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
  payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  status: IntegrationStatus.Active,
  description: "Drift Main PYUSD",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: false,
  mint: PYUSD_MINT,
  subAccountId: 0, // TODO: update to actual sub account ID
  spotMarketIndex: 0, // TODO: update to actual spot market index
  poolId: 0, // TODO: update to actual pool ID
};

