import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzSolanaGovernancePayloadToInstruction,
  getRpcEndpoint,
  readAndValidateNetworkStablecoinConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
  validateSuccess,
  computeIntegrationHash,
  readMetadataFile,
} from "../../src";
import { address } from "@solana/kit";
import { getNetworkConfigs, ACTION } from "./config";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  IntegrationType,
  getIntegrationCodec,
  integrationConfig,
} from "@keel-fi/svm-alm-controller";

const main = async () => {
  const args = readArgs(ACTION);
  
  // Read expiryTimestamp from metadata file (same value used in generate-payload.ts)
  const metadata = readMetadataFile(args.file);
  if (!metadata || !metadata.expiryTimestamp) {
    throw new Error(
      `Metadata file not found for ${args.file}. Please run generate-payload.ts first.`
    );
  }
  const expiryTimestamp = BigInt(metadata.expiryTimestamp);
  
  // Use the same timestamp to avoid fetching a new one
  const networkConfigs = await getNetworkConfigs(expiryTimestamp);
  const { config } = readAndValidateNetworkStablecoinConfig(networkConfigs);
  //const rpcUrl = getRpcEndpoint();
  const rpcUrl = "http://localhost:8899";
  const connection = new web3.Connection(rpcUrl);
  const payload = readPayloadFile(args.file);

  const payerPubkey = new web3.PublicKey(config.payer);
  const instruction = convertLzSolanaGovernancePayloadToInstruction(
    payload,
    new web3.PublicKey(config.controllerProgramId),
    new web3.PublicKey(config.authority),
    payerPubkey
  );

  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
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
  const integrationConfigData = integrationConfig("AtomicSwap", [
    atomicSwapConfig,
  ]);
  const integrationHash = computeIntegrationHash(
    IntegrationType.AtomicSwap,
    integrationConfigData
  );
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash
  );

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  if (controllerResp?.before && controllerResp?.after) {
    assertNoAccountChanges(controllerResp.before, controllerResp.after);
  }

  // Assert controller authority does not change
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );
  const controllerAuthorityResp = resp[controllerAuthority];
  if (controllerAuthorityResp?.before && controllerAuthorityResp?.after) {
    assertNoAccountChanges(
      controllerAuthorityResp.before,
      controllerAuthorityResp.after
    );
  }

  // Assert authority does not change
  const authorityResp = resp[config.authority];
  if (authorityResp?.before && authorityResp?.after) {
    assertNoAccountChanges(authorityResp.before, authorityResp.after);
  }

  // Assert permission does not change
  const permissionResp = resp[permissionPda];
  if (permissionResp?.before && permissionResp?.after) {
    assertNoAccountChanges(permissionResp.before, permissionResp.after);
  }

  // Assert integration is created
  const integrationResp = resp[integrationPda];
  console.log(integrationPda.toString());
  assert(integrationResp.after, "Integration should be created");
  if (integrationResp.before) {
    assert.notDeepEqual(
      integrationResp.after.data,
      integrationResp.before.data,
      "Integration data should change"
    );
  }

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const [integration] = integrationCodec.read(integrationResp.after.data, 1);
  assert.equal(integration.config.__kind, "AtomicSwap");
  assert.equal(integration.status, config.status);

  validateSuccess(args.file);
};

main();
