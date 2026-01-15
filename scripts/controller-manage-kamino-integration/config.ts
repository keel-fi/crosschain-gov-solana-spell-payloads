import { BaseControllerManageIntegrationConfig } from "../../src";

export const ACTION = "controller-manage-kamino-integration";

export type ControllerManageKaminoIntegrationConfig =
  BaseControllerManageIntegrationConfig & {
    // Kamino specific args (used to derive integration PDA)
    obligationId: number;
    market: string;
    reserve: string;
    reserveLiquidityMint: string;
    referrer: string;
    reserveFarmCollateral: string;
  };

