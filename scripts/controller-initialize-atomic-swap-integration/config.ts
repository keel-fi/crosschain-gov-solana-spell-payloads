import {
  BaseControllerIntegrationConfig,
} from "../../src";

export const ACTION = "controller-initialize-atomic-swap-integration";

export type ControllerInitializeAtomicSwapIntegrationConfig = BaseControllerIntegrationConfig & {
  // Atomic swap specific args
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
