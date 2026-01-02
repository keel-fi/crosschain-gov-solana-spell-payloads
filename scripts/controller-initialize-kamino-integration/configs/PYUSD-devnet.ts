import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";

export default {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
  authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
  payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  status: IntegrationStatus.Active,
  description: "Kamino Main PYUSD",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: true,
  obligationId: 0, // TODO: update to actual obligation ID
  market: "", // TODO: update to actual market address
  reserve: "", // TODO: update to actual reserve address
  reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
  referrer: "", // TODO: update to actual referrer address
  reserveFarmCollateral: "", // TODO: update to actual reserve farm collateral address
};

