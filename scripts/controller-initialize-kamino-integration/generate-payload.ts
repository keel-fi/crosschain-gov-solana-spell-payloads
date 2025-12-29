// Generates a payload for initializing a Kamino Integration account

import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import {
  address,
  createNoopSigner,
} from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  deriveControllerAuthorityPda,
  kamino,
  createKaminoLendInitializeIntegrationInstruction,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printControllerInitializeKaminoIntegrationPayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const obligation = await kamino.deriveVanillaObligationAddress(
    config.obligationId,
    address(controllerAuthority),
    address(config.market)
  );


  if (config.description.length > 32) {
    throw new Error("Description is too long. Must be 32 bytes or less.");
  }

  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const instruction = await createKaminoLendInitializeIntegrationInstruction(
    createNoopSigner(lzPayerSentinel),
    address(config.controller),
    createNoopSigner(address(config.authority)),
    config.description,
    config.status,
    config.rateLimitSlope,
    config.rateLimitMaxOutflow,
    config.permitLiquidation,
    address(config.market),
    address(config.reserve),
    address(config.reserveLiquidityMint),
    address(obligation),
    config.obligationId,
    address(config.reserveFarmCollateral),
    address(config.referrer),
  );

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeKaminoIntegrationPayload();
