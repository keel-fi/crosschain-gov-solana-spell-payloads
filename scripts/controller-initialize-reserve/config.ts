import {
  ReserveStatus,
} from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-initialize-reserve";

export type ControllerInitializeReserveConfig = {
  controllerProgramId: string;
  // Controller that the Reserve applies to
  controller: string;
  // Authority that has permission to initialize the reserve
  authority: string;
  // Mint address for the reserve
  mint: string;
  payer: string;
  // Reserve status
  status: ReserveStatus;
  // Rate limit slope
  rateLimitSlope: bigint;
  // Rate limit max outflow
  rateLimitMaxOutflow: bigint;
  tokenProgram: string;
};
