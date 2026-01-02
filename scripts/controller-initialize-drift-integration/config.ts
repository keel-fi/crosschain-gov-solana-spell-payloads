import {
  BaseControllerIntegrationConfig,
} from "../../src";

export const ACTION = "controller-initialize-drift-integration";

export type ControllerInitializeDriftIntegrationConfig = BaseControllerIntegrationConfig & {
  outputFile: string;
  // Mint address
  mint: string;
  // Drift specific args
  subAccountId: number;
  spotMarketIndex: number;
  poolId: number;
};

