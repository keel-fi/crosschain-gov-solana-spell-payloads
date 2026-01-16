import { BaseControllerManageIntegrationConfig } from "../../src";
import { IntegrationStatus } from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-atomic-swap-integration";

export type ControllerManageAtomicSwapIntegrationConfig =
  BaseControllerManageIntegrationConfig & {
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
