import { ReserveStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { DEVNET_CONTROLLER, KEEL_DEPLOYER, DEVNET_PAYER } from "../../../src";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export default {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: DEVNET_CONTROLLER,
  authority: KEEL_DEPLOYER,
  mint: "", // TODO: update to actual CASH mint
  payer: DEVNET_PAYER,
  status: ReserveStatus.Active,
  rateLimitSlope: 0n,
  rateLimitMaxOutflow: 0n,
  tokenProgram: TOKEN_2022_PROGRAM_ID.toString(),
};

