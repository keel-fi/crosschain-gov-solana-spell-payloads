import {
  IntegrationStatus,
} from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-kamino-integration";

export type ControllerManageKaminoIntegrationConfig = {
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
  // Kamino specific args (used to derive integration PDA)
  obligationId: number;
  market: string;
  reserve: string;
  reserveLiquidityMint: string;
  referrer: string;
  reserveFarmCollateral: string;
};

