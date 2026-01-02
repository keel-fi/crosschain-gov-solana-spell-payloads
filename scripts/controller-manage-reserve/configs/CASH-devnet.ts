import { ReserveStatus, SVM_ALM_CONTROLLER_PROGRAM_ADDRESS } from "@keel-fi/svm-alm-controller";

export default {
  outputFile: "controller-manage-reserve-CASH-devnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
  controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
  authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
  mint: "", // TODO: update to actual CASH mint
  payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
  status: ReserveStatus.Active,
  rateLimitSlope: null,
  rateLimitMaxOutflow: null,
};

