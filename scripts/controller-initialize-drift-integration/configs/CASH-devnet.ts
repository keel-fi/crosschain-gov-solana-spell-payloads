import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { CASH_MINT, DEVNET_CONTROLLER, DEVNET_PAYER, KEEL_DEPLOYER } from "../../../src";

export default {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: DEVNET_CONTROLLER,
  authority: KEEL_DEPLOYER,
  payer: DEVNET_PAYER,
  status: IntegrationStatus.Active,
  description: "Drift Main CASH",
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  permitLiquidation: false,
  mint: CASH_MINT,
  subAccountId: 0, // TODO: update to actual sub account ID
  spotMarketIndex: 0, // TODO: update to actual spot market index
  poolId: 0, // TODO: update to actual pool ID
};

