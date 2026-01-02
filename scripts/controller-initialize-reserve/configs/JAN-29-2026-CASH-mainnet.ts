import { ReserveStatus } from "@keel-fi/svm-alm-controller";
import { CASH_MINT, KEEL_SUB_PROXY_CPI_AUTHORITY, MAINNET_PAYER_2, SVM_ALM_CONTROLLER, SVM_ALM_CONTROLLER_PROGRAM_ID } from "../../../src";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export default {
  outputFile: "controller-initialize-reserve-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  mint: CASH_MINT,
  payer: MAINNET_PAYER_2,
  status: ReserveStatus.Active,
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  tokenProgram: TOKEN_2022_PROGRAM_ID.toString(),
};

