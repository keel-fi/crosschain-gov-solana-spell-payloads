// Generates a payload for initializing a Drift Integration account

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
  createDriftInitializeIntegrationInstruction,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printControllerInitializeDriftIntegrationPayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const instruction = await createDriftInitializeIntegrationInstruction(
    createNoopSigner(lzPayerSentinel),
    address(config.controller),
    createNoopSigner(address(config.authority)),
    address(config.mint),
    config.description,
    config.status,
    config.rateLimitSlope,
    config.rateLimitMaxOutflow,
    config.permitLiquidation,
    config.subAccountId,
    config.spotMarketIndex,
    config.poolId,
  );

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeDriftIntegrationPayload();

