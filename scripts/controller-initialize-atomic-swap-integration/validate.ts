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
} from "../../src";
import { address } from "@solana/kit";
import {
  NETWORK_CONFIGS,
  ACTION,
} from "./config";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  IntegrationType,
  getIntegrationCodec,
  integrationConfig,
} from "@keel-fi/svm-alm-controller";

const main = async () => {
  const { config } = readAndValidateNetworkStablecoinConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs(ACTION);
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
    address(config.authority),
  );

  // Compute integration hash
  // Note: AtomicSwapConfig requires all fields, so we use placeholder values for fields
  // that are not needed (since the actual config is in InitializeArgs)
  const atomicSwapConfig = {
    inputToken: address(web3.SystemProgram.programId.toString()), // Placeholder
    outputToken: address(web3.SystemProgram.programId.toString()), // Placeholder
    oracle: address(web3.SystemProgram.programId.toString()), // Placeholder
    maxStaleness: config.maxStaleness,
    expiryTimestamp: config.expiryTimestamp,
    maxSlippageBps: config.maxSlippageBps,
    inputMintDecimals: 0, // Placeholder
    outputMintDecimals: 0, // Placeholder
    oraclePriceInverted: config.oraclePriceInverted,
    padding: new Uint8Array(32), // 32 bytes padding
  };
  const integrationConfigData = integrationConfig("AtomicSwap", [atomicSwapConfig]);
  const integrationHash = computeIntegrationHash(
    IntegrationType.AtomicSwap,
    integrationConfigData
  );
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash,
  );

  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  assertNoAccountChanges(controllerResp.before, controllerResp.after);

  // Assert controller authority does not change
  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller),
  );
  const controllerAuthorityResp = resp[controllerAuthority];
  assertNoAccountChanges(
    controllerAuthorityResp?.before,
    controllerAuthorityResp?.after
  );

  // Assert authority does not change
  const authorityResp = resp[config.authority];
  assertNoAccountChanges(authorityResp.before, authorityResp.after);

  // Assert permission does not change
  const permissionResp = resp[permissionPda];
  if (permissionResp.before) {
    assertNoAccountChanges(permissionResp.before, permissionResp.after);
  }

  // Assert integration is created
  const integrationResp = resp[integrationPda];
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

