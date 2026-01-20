import {
  ReserveStatus,
} from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-reserve";

export type ControllerManageReserveConfig = {
  outputFile: string;
  controllerProgramId: string;
  // Controller that the Reserve applies to
  controller: string;
  // Authority that has permission to manage the reserve
  authority: string;
  // Mint address for the reserve
  mint: string;
  payer: string;
  // Reserve status (optional - null means no change)
  status: ReserveStatus | null;
  // Rate limit slope (optional - null means no change)
  rateLimitSlope: bigint | null;
  // Rate limit max outflow (optional - null means no change)
  rateLimitMaxOutflow: bigint | null;
};

