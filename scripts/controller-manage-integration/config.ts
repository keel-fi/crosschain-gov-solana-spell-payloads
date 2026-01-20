import { BaseControllerManageIntegrationConfig } from "../../src";

export const ACTION = "controller-manage-integration";

export type ControllerManageIntegrationConfig =
  BaseControllerManageIntegrationConfig & {
    // Hardcoded integration PDA address
    integration: string;
  };
