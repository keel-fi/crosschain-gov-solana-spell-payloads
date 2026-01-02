import { ReserveStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  CASH_MINT,
  MAINNET_PAYER,
} from "../../../src";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export default {
  outputFile: "controller-initialize-reserve-CASH-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  mint: CASH_MINT,
  payer: MAINNET_PAYER,
  status: ReserveStatus.Active,
  rateLimitSlope: 10_000_000_000_000n,
  rateLimitMaxOutflow: 25_000_000_000_000n,
  tokenProgram: TOKEN_2022_PROGRAM_ID.toString(),
};

