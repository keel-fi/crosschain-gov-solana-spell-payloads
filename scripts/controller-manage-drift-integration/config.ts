import {
  IntegrationStatus,
} from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-drift-integration";

export type ControllerManageDriftIntegrationConfig = {
  outputFile: string;
  controllerProgramId: string;
  // Controller that the Integration applies to
  controller: string;
  // Authority that has permission to manage the integration
  authority: string;
  payer: string;
  // Integration status (optional - null means no change)
  status: IntegrationStatus | null;
  // Description of the integration (optional - null means no change)
  description: string | null;
  // Rate limit slope (optional - null means no change)
  rateLimitSlope: bigint | null;
  // Rate limit max outflow (optional - null means no change)
  rateLimitMaxOutflow: bigint | null;
  // Mint address (used to identify the integration)
  mint: string;
  // Drift specific args (used to derive integration PDA)
  subAccountId: number;
  spotMarketIndex: number;
  poolId: number;
};

