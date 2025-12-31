import { BaseControllerIntegrationConfig } from "../../src";

export const ACTION = "controller-initialize-kamino-integration";

export type ControllerInitializeKaminoIntegrationConfig =
  BaseControllerIntegrationConfig & {
    outputFile: string;
    // Kamino specific args
    obligationId: number;
    market: string;
    reserve: string;
    reserveLiquidityMint: string;
    referrer: string;
    reserveFarmCollateral: string;
  };
