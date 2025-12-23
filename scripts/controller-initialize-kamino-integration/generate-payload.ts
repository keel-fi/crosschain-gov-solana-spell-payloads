// Generates a payload for initializing a Kamino Integration account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
  computeIntegrationHash,
} from "../../src";
import {
  Address,
  address,
  createNoopSigner,
  getAddressEncoder,
  getProgramDerivedAddress,
  AccountRole,
} from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getInitializeIntegrationInstruction,
  IntegrationType,
  initializeArgs,
  integrationConfig,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  kamino,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printControllerInitializeKaminoIntegrationPayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );
  const obligation = await kamino.deriveVanillaObligationAddress(
    config.obligationId,
    address(controllerAuthority),
    address(config.market)
  );
  // Create kamino config
  const kaminoConfig = {
    market: address(config.market),
    reserve: address(config.reserve),
    reserveLiquidityMint: address(config.reserveLiquidityMint),
    obligation: address(obligation),
    obligationId: config.obligationId,
    padding: new Uint8Array(95),
  };
  const integrationConfigData = integrationConfig("Kamino", [kaminoConfig]);

  // Compute integration hash
  const integrationHash = computeIntegrationHash(
    IntegrationType.Kamino,
    integrationConfigData
  );

  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash
  );

  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const innerArgs = initializeArgs("KaminoIntegration", {
    obligationId: config.obligationId,
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
    integrationType: IntegrationType.Kamino,
    status: config.status,
    description: Buffer.from(config.description, "utf-8"),
    rateLimitSlope: config.rateLimitSlope,
    rateLimitMaxOutflow: config.rateLimitMaxOutflow,
    permitLiquidation: config.permitLiquidation,
    innerArgs: innerArgs,
  });

  // Derive additional PDAs needed for remaining accounts
  const userMetadata = await kamino.deriveUserMetadataAddress(controllerAuthority);
  const marketAuthority = await kamino.deriveMarketAuthorityAddress(
    address(config.market)
  );
  const obligationFarmCollateral = await kamino.deriveObligationFarmAddress(
    address(config.reserveFarmCollateral),
    address(obligation)
  );

  // Add remaining accounts for Kamino integration
  // 1. Obligation (writable)
  instruction.accounts.push({
    address: address(obligation),
    role: AccountRole.WRITABLE,
  });

  // 2. Reserve liquidity mint (readonly)
  instruction.accounts.push({
    address: address(config.reserveLiquidityMint),
    role: AccountRole.READONLY,
  });

  // 3. User metadata (writable)
  instruction.accounts.push({
    address: userMetadata.address,
    role: AccountRole.WRITABLE,
  });

  // 4. Referrer (readonly)
  instruction.accounts.push({
    address: address(config.referrer),
    role: AccountRole.READONLY,
  });

  // 5. Obligation farm collateral (writable)
  instruction.accounts.push({
    address: obligationFarmCollateral,
    role: AccountRole.WRITABLE,
  });

  // 6. Reserve (writable)
  instruction.accounts.push({
    address: address(config.reserve),
    role: AccountRole.WRITABLE,
  });

  // 7. Reserve farm collateral (writable)
  instruction.accounts.push({
    address: address(config.reserveFarmCollateral),
    role: AccountRole.WRITABLE,
  });

  // 8. Market authority (readonly)
  instruction.accounts.push({
    address: marketAuthority.address,
    role: AccountRole.READONLY,
  });

  // 9. Market (readonly)
  instruction.accounts.push({
    address: address(config.market),
    role: AccountRole.READONLY,
  });

  // 10. Kamino Lend Program ID (readonly)
  instruction.accounts.push({
    address: address(kamino.KAMINO_LEND_PROGRAM_ID),
    role: AccountRole.READONLY,
  });

  // 11. Kamino Farms Program ID (readonly)
  instruction.accounts.push({
    address: address(kamino.KAMINO_FARMS_PROGRAM_ID),
    role: AccountRole.READONLY,
  });

  // 12. System Program (readonly)
  instruction.accounts.push({
    address: address(web3.SystemProgram.programId.toString()),
    role: AccountRole.READONLY,
  });

  // 13. Rent sysvar (readonly)
  instruction.accounts.push({
    address: address(web3.SYSVAR_RENT_PUBKEY.toString()),
    role: AccountRole.READONLY,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeKaminoIntegrationPayload();
