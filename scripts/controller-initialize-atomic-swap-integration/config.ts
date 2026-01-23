import {
  BaseControllerIntegrationConfig,
} from "../../src";

export const ACTION = "controller-initialize-atomic-swap-integration";

export type ControllerInitializeAtomicSwapIntegrationConfig = BaseControllerIntegrationConfig & {
    // Output file
    outputFile: string;
    // Atomic swap specific args
    // Maximum slippage in basis points
    maxSlippageBps: number;
    // Maximum staleness
    maxStaleness: bigint;
    // Expiry timestamp
    expiryTimestamp: bigint;
    // Whether oracle price is inverted
    oraclePriceInverted: boolean;
    // Input token mint address
    inputTokenMint: string;
    // Output token mint address
    outputTokenMint: string;
    // Oracle address
    oracle: string;
    // Input mint decimals
    inputMintDecimals: number;
    // Output mint decimals
    outputMintDecimals: number;
};
