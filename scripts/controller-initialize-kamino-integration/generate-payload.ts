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
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS, KAMINO_LEND_PROGRAM_ID } from "./config";

export const KAMINO_FARMS_PROGRAM_ID =
  "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr";

/// Derives vanilla obligation address
export const deriveVanillaObligationAddress = async (
  obligationId: number,
  authority: Address,
  market: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [obligationPda] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_LEND_PROGRAM_ID),
    seeds: [
      // tag 0 for vanilla obligation
      Buffer.from([0]),
      // id
      Buffer.from(new Uint8Array([obligationId])),
      // user
      addressEncoder.encode(authority),
      // kamino market
      addressEncoder.encode(market),
      // seed 1, for lending obligation is the token
      addressEncoder.encode(address("11111111111111111111111111111111")),
      // seed 2, for lending obligation is the token
      addressEncoder.encode(address("11111111111111111111111111111111")),
    ],
  });

  return obligationPda;
};

/// Derives reserve liquidity supply address
export const deriveReserveLiquiditySupply = async (
  market: Address,
  reserveLiquidityMint: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_LEND_PROGRAM_ID),
    seeds: [
      "reserve_liq_supply",
      addressEncoder.encode(market),
      addressEncoder.encode(reserveLiquidityMint),
    ],
  });

  return pda;
};

/// Derives reserve collateral mint address
export const deriveReserveCollateralMint = async (
  market: Address,
  reserveLiquidityMint: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_LEND_PROGRAM_ID),
    seeds: [
      "reserve_coll_mint",
      addressEncoder.encode(market),
      addressEncoder.encode(reserveLiquidityMint),
    ],
  });

  return pda;
};

/// Derives reserve collateral supply address
export const deriveReserveCollateralSupply = async (
  market: Address,
  reserveLiquidityMint: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_LEND_PROGRAM_ID),
    seeds: [
      "reserve_coll_supply",
      addressEncoder.encode(market),
      addressEncoder.encode(reserveLiquidityMint),
    ],
  });

  return pda;
};

/// Derives market authority address
export const deriveMarketAuthorityAddress = async (market: Address) => {
  const addressEncoder = getAddressEncoder();

  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_LEND_PROGRAM_ID),
    seeds: ["lma", addressEncoder.encode(market)],
  });

  return { address: pda, bump };
};

/// Derives obligation farm address
export const deriveObligationFarmAddress = async (
  reserveFarm: Address,
  obligation: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_FARMS_PROGRAM_ID),
    seeds: [
      "user",
      addressEncoder.encode(reserveFarm),
      addressEncoder.encode(obligation),
    ],
  });

  return pda;
};

/// Derives user metadata address
export const deriveUserMetadataAddress = async (user: Address) => {
  const addressEncoder = getAddressEncoder();

  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_LEND_PROGRAM_ID),
    seeds: ["user_meta", addressEncoder.encode(user)],
  });

  return { address: pda, bump };
};

/// Derives rewards vault address
export const deriveRewardsVault = async (
  farmState: Address,
  rewardsVaultMint: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_FARMS_PROGRAM_ID),
    seeds: [
      "rvault",
      addressEncoder.encode(farmState),
      addressEncoder.encode(rewardsVaultMint),
    ],
  });

  return pda;
};

/// Derives rewards treasury vault address
export const deriveRewardsTreasuryVault = async (
  globalConfig: Address,
  rewardsVaultMint: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_FARMS_PROGRAM_ID),
    seeds: [
      "tvault",
      addressEncoder.encode(globalConfig),
      addressEncoder.encode(rewardsVaultMint),
    ],
  });

  return pda;
};

/// Derives farm vaults authority address
export const deriveFarmVaultsAuthority = async (farmState: Address) => {
  const addressEncoder = getAddressEncoder();

  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_FARMS_PROGRAM_ID),
    seeds: ["authority", addressEncoder.encode(farmState)],
  });

  return { address: pda, bump };
};

/// Derives KFarms treasury vault authority address
export const deriveKFarmsTreasuryVaultAuthority = async (
  globalConfig: Address
) => {
  const addressEncoder = getAddressEncoder();

  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: address(KAMINO_FARMS_PROGRAM_ID),
    seeds: ["authority", addressEncoder.encode(globalConfig)],
  });

  return { address: pda, bump };
};

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
  const obligation = await deriveVanillaObligationAddress(
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
  const userMetadata = await deriveUserMetadataAddress(controllerAuthority);
  const marketAuthority = await deriveMarketAuthorityAddress(
    address(config.market)
  );
  const obligationFarmCollateral = await deriveObligationFarmAddress(
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
    address: address(KAMINO_LEND_PROGRAM_ID),
    role: AccountRole.READONLY,
  });

  // 11. Kamino Farms Program ID (readonly)
  instruction.accounts.push({
    address: address(KAMINO_FARMS_PROGRAM_ID),
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
