import { ReserveStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export default {
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
  authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
  mint: "", // TODO: update to actual CASH mint
  payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  status: ReserveStatus.Active,
  rateLimitSlope: 0n,
  rateLimitMaxOutflow: 0n,
  tokenProgram: TOKEN_2022_PROGRAM_ID.toString(),
};

