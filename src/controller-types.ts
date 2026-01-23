import { IntegrationStatus } from "@keel-fi/svm-alm-controller";

/**
 * Base type containing common fields for all controller integration configs
 */
export type BaseControllerIntegrationConfig = {
  controllerProgramId: string;
  // Controller that the Integration applies to
  controller: string;
  // Authority that has permission to initialize the integration
  authority: string;
  payer: string;
  // Integration status
  status: IntegrationStatus;
  // Description of the integration
  description: string;
  // Rate limit slope
  rateLimitSlope: bigint;
  // Rate limit max outflow
  rateLimitMaxOutflow: bigint;
  // Permit liquidation
  permitLiquidation: boolean;
};

