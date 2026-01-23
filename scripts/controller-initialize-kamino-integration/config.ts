import { BaseControllerIntegrationConfig } from "../../src";

export const ACTION = "controller-initialize-kamino-integration";

export type ControllerInitializeKaminoIntegrationConfig =
  BaseControllerIntegrationConfig & {
    outputFile: string;
    // Kamino specific args
    // Obligation ID
    obligationId: number;
    // Kamino market address
    market: string;
    // Kamino reserve address
    reserve: string;
    // Reserve liquidity mint address
    reserveLiquidityMint: string;
    // Referrer address
    referrer: string;
    // Reserve farm collateral address
    reserveFarmCollateral: string;
  };
