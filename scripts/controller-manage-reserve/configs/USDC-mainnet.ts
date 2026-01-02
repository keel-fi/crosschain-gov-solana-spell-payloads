import { ReserveStatus } from "@keel-fi/svm-alm-controller";
import {
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  SVM_ALM_CONTROLLER,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDC_MINT,
} from "../../../src";

export default {
  outputFile: "controller-manage-reserve-USDC-mainnet.txt",
  controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
  controller: SVM_ALM_CONTROLLER,
  authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
  mint: USDC_MINT,
  payer: "2rRM7kWjWjS7CGoRnSHTMu4daS24YAA9BgcP1qo2v1UC",
  status: ReserveStatus.Active,
  rateLimitSlope: 0n,
  rateLimitMaxOutflow: 0n,
};

