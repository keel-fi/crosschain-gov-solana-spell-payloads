// Generates a payload for initializing an Atomic Swap Integration account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
  computeIntegrationHash,
  getRpcEndpoint,
  writeMetadataFile,
} from "../../src";
import { Address, address, createNoopSigner, AccountRole } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getInitializeIntegrationInstruction,
  IntegrationType,
  initializeArgs,
  integrationConfig,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
} from "@keel-fi/svm-alm-controller";
import { ACTION, getNetworkConfigs } from "./config";

const printControllerInitializeAtomicSwapIntegrationPayload = async () => {
  const networkConfigs = await getNetworkConfigs();
  const { config } = readAndValidateNetworkStablecoinConfig(networkConfigs);
  const args = readArgs(ACTION);
  
  // Fetch expiryTimestamp from Solana clock (only once)
  const expiryTimestamp = config.expiryTimestamp;
  
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority),
  );
  
  const atomicSwapConfig = {
    inputToken: address(config.inputTokenMint),
    outputToken: address(config.outputTokenMint),
    oracle: address(config.oracle),
    maxStaleness: config.maxStaleness,
    expiryTimestamp,
    maxSlippageBps: config.maxSlippageBps,
    inputMintDecimals: config.inputMintDecimals,
    outputMintDecimals: config.outputMintDecimals,
    oraclePriceInverted: config.oraclePriceInverted,
    padding: new Uint8Array(107),
  };
  const integrationConfigData = integrationConfig("AtomicSwap", [atomicSwapConfig]);
  
  // Compute integration hash
  const integrationHash = computeIntegrationHash(
    IntegrationType.AtomicSwap,
    integrationConfigData
  );
  
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash,
  );

  console.log(integrationPda.toString());
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const innerArgs = initializeArgs("AtomicSwap", {
    maxSlippageBps: config.maxSlippageBps,
    maxStaleness: config.maxStaleness,
    expiryTimestamp,
    oraclePriceInverted: config.oraclePriceInverted,
  });

  const instruction = getInitializeIntegrationInstruction({
    payer: createNoopSigner(lzPayerSentinel),
    controller: address(config.controller),
    controllerAuthority: controllerAuthority,
    authority: createNoopSigner(address(config.authority)),
    permission: permissionPda,
    integration: integrationPda,
    programId: address(config.controllerProgramId),
    systemProgram: fromLegacyPublicKey(web3.SystemProgram.programId),
    integrationType: IntegrationType.AtomicSwap,
    status: config.status,
    description: Buffer.from(config.description, "utf-8"),
    rateLimitSlope: config.rateLimitSlope,
    rateLimitMaxOutflow: config.rateLimitMaxOutflow,
    permitLiquidation: config.permitLiquidation,
    innerArgs: innerArgs,
  });

  instruction.accounts.push({
    address: address(config.inputTokenMint),
    role: AccountRole.READONLY,
  });
  instruction.accounts.push({
    address: address(config.outputTokenMint),
    role: AccountRole.READONLY,
  });
  instruction.accounts.push({
    address: address(config.oracle),
    role: AccountRole.READONLY,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
  
  // Write expiryTimestamp to metadata file so validate.ts can use the same value
  writeMetadataFile(args.file, { expiryTimestamp: expiryTimestamp.toString() });
};

printControllerInitializeAtomicSwapIntegrationPayload();

