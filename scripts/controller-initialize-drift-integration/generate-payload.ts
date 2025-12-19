// Generates a payload for initializing a Drift Integration account

import { web3 } from "@coral-xyz/anchor";
import {
  convertKitInstructionToWeb3Js,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
  computeIntegrationHash,
  DRIFT_PROGRAM_ID,
} from "../../src";
import { address, createNoopSigner, AccountRole } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getInitializeIntegrationInstruction,
  IntegrationType,
  initializeArgs,
  integrationConfig,
  getDriftConfigEncoder,
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
} from "@keel-fi/svm-alm-controller";
import { ACTION, NETWORK_CONFIGS } from "./config";

// Helper functions to derive Drift PDAs
async function deriveDriftUserStatsPda(
  authority: string
): Promise<web3.PublicKey> {
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user_stats"), new web3.PublicKey(authority).toBuffer()],
    new web3.PublicKey(DRIFT_PROGRAM_ID)
  );
  return pda;
}

async function deriveDriftUserPda(
  authority: string,
  subAccountId: number
): Promise<web3.PublicKey> {
  const subAccountIdBuffer = Buffer.allocUnsafe(2);
  subAccountIdBuffer.writeUInt16LE(subAccountId, 0);
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("user"),
      new web3.PublicKey(authority).toBuffer(),
      subAccountIdBuffer,
    ],
    new web3.PublicKey(DRIFT_PROGRAM_ID)
  );
  return pda;
}

async function deriveDriftStatePda(): Promise<web3.PublicKey> {
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("drift_state")],
    new web3.PublicKey(DRIFT_PROGRAM_ID)
  );
  return pda;
}

async function deriveDriftSpotMarketPda(
  spotMarketIndex: number
): Promise<web3.PublicKey> {
  const spotMarketIndexBuffer = Buffer.allocUnsafe(2);
  spotMarketIndexBuffer.writeUInt16LE(spotMarketIndex, 0);
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("spot_market"), spotMarketIndexBuffer],
    new web3.PublicKey(DRIFT_PROGRAM_ID)
  );
  return pda;
}

const printControllerInitializeDriftIntegrationPayload = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);
  
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
  );
  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority),
  );

  // Derive Drift PDAs
  // Convert controllerAuthority to string for PDA derivation
  const controllerAuthorityStr = String(controllerAuthority);
  const userStatsPda = await deriveDriftUserStatsPda(controllerAuthorityStr);
  const userPda = await deriveDriftUserPda(
    controllerAuthorityStr,
    config.subAccountId
  );
  const statePda = await deriveDriftStatePda();
  const spotMarketPda = await deriveDriftSpotMarketPda(
    config.spotMarketIndex
  );

  // Create drift config
  const driftConfigEncoder = getDriftConfigEncoder();
  const driftConfig = {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
    poolId: config.poolId,
    padding: new Uint8Array(219),
  };
  const integrationConfigData = integrationConfig("Drift", [driftConfig]);
  
  // Compute integration hash
  const integrationHash = computeIntegrationHash(
    IntegrationType.Drift,
    integrationConfigData
  );
  
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash,
  );
  
  const lzPayerSentinel = fromLegacyPublicKey(LZ_PAYER_PLACEHOLDER);

  const innerArgs = initializeArgs("Drift", {
    subAccountId: config.subAccountId,
    spotMarketIndex: config.spotMarketIndex,
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
    integrationType: IntegrationType.Drift,
    status: config.status,
    description: Buffer.from(config.description, "utf-8"),
    rateLimitSlope: config.rateLimitSlope,
    rateLimitMaxOutflow: config.rateLimitMaxOutflow,
    permitLiquidation: config.permitLiquidation,
    innerArgs: innerArgs,
  });

  // Add remaining accounts for Drift integration
  // 1. Mint (readonly)
  instruction.accounts.push({
    address: address(config.mint),
    role: AccountRole.READONLY,
  });

  // 2. User PDA (writable)
  instruction.accounts.push({
    address: address(userPda.toString()),
    role: AccountRole.WRITABLE,
  });

  // 3. User Stats PDA (writable)
  instruction.accounts.push({
    address: address(userStatsPda.toString()),
    role: AccountRole.WRITABLE,
  });

  // 4. State PDA (writable)
  instruction.accounts.push({
    address: address(statePda.toString()),
    role: AccountRole.WRITABLE,
  });

  // 5. Spot Market PDA (readonly)
  instruction.accounts.push({
    address: address(spotMarketPda.toString()),
    role: AccountRole.READONLY,
  });

  // 6. Rent sysvar (readonly)
  instruction.accounts.push({
    address: address(web3.SYSVAR_RENT_PUBKEY.toString()),
    role: AccountRole.READONLY,
  });

  // 7. Drift Program ID (readonly)
  instruction.accounts.push({
    address: address(DRIFT_PROGRAM_ID),
    role: AccountRole.READONLY,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printControllerInitializeDriftIntegrationPayload();

