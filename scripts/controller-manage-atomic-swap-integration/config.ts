import {
  IntegrationStatus,
} from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-atomic-swap-integration";

export type ControllerManageAtomicSwapIntegrationConfig = {
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
  // Atomic swap specific args (used to derive integration PDA)
  maxSlippageBps: number;
  maxStaleness: bigint;
  expiryTimestamp: bigint;
  oraclePriceInverted: boolean;
  inputTokenMint: string;
  outputTokenMint: string;
  oracle: string;
  inputMintDecimals: number;
  outputMintDecimals: number;
};

