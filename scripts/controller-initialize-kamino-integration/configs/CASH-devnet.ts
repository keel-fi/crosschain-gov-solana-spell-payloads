import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { DEVNET_CONTROLLER, KEEL_DEPLOYER, DEVNET_PAYER } from "../../../src";

export default {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: DEVNET_CONTROLLER,
  authority: KEEL_DEPLOYER,
  payer: DEVNET_PAYER,
  status: IntegrationStatus.Active,
  description: "Kamino Main CASH",
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

