import { BaseControllerManageIntegrationConfig } from "../../src";

export const ACTION = "controller-manage-drift-integration";

export type ControllerManageDriftIntegrationConfig =
  BaseControllerManageIntegrationConfig & {
    // Mint address (used to identify the integration)
    mint: string;
    // Drift specific args (used to derive integration PDA)
    subAccountId: number;
    spotMarketIndex: number;
    poolId: number;
  };

