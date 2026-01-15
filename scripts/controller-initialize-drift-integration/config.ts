import { BaseControllerIntegrationConfig } from "../../src";

export const ACTION = "controller-initialize-drift-integration";

export type ControllerInitializeDriftIntegrationConfig =
  BaseControllerIntegrationConfig & {
    // Output file
    outputFile: string;
    // Mint address
    mint: string;
    // Drift specific args
    // Sub account ID
    subAccountId: number;
    // Spot market index
    spotMarketIndex: number;
    // Pool ID
    poolId: number;
  };
