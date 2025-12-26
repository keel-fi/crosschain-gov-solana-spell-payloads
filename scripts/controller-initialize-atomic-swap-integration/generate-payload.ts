// Generates a payload for initializing an Atomic Swap Integration account

import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  createAtomicSwapInitializeIntegrationInstruction,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printControllerInitializeAtomicSwapIntegrationPayload = async () => {
  const args = readArgs(ACTION);
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  
  const expiryTimestamp = config.expiryTimestamp;
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  if (config.description.length > 32) {
    throw new Error("Description is too long. Must be 32 bytes or less.");
  }

  const instruction = await createAtomicSwapInitializeIntegrationInstruction(
    createNoopSigner(lzPayerSentinel),
    address(config.controller),
    createNoopSigner(address(config.authority)),
    config.description,
    config.status,
    config.rateLimitSlope,
    config.rateLimitMaxOutflow,
    config.permitLiquidation,
    address(config.inputTokenMint),
    config.inputMintDecimals,
    address(config.outputTokenMint),
    config.outputMintDecimals,
    address(config.oracle),
    config.maxStaleness,
    expiryTimestamp,
    config.maxSlippageBps,
    config.oraclePriceInverted,
  );

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeAtomicSwapIntegrationPayload();

