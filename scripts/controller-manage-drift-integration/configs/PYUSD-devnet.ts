import { IntegrationStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { DEVNET_CONTROLLER, DEVNET_PAYER, KEEL_DEPLOYER, PYUSD_MINT } from "../../../src";

export default {
  outputFile: "controller-manage-drift-integration-PYUSD-devnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: DEVNET_CONTROLLER,
  authority: KEEL_DEPLOYER,
  payer: DEVNET_PAYER,
  status: IntegrationStatus.Active,
  description: null, // null means no change
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
  mint: PYUSD_MINT,
  subAccountId: 0, // TODO: update to actual sub account ID
  spotMarketIndex: 0, // TODO: update to actual spot market index
  poolId: 0, // TODO: update to actual pool ID
};

