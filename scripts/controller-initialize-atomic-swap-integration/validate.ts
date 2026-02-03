import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertContainsIn,
  assertInitializeIntegrationCommonAccountChanges,
  assertIntegrationCreated,
  validateCommonIntegrationFields,
  readConfigFromFile,
  readArgs,
  simulatePayloadWithCompleteCrossChainFlow,
  validateSuccess,
  assertNoAccountChanges,
  readPayloadOrDecodePacket,
} from "../../src";
import { address } from "@solana/kit";
import {
  ACTION,
  ControllerInitializeAtomicSwapIntegrationConfig,
} from "./config";
import {
  deriveControllerAuthorityPda,
  derivePermissionPda,
  deriveIntegrationPda,
  getIntegrationCodec,
  integrationConfig,
  computeIntegrationHash,
} from "@keel-fi/svm-alm-controller";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export const validateInitAtomicSwap = async (
  config: ControllerInitializeAtomicSwapIntegrationConfig,
  packetBytes: string | undefined,
) => {
  const payload = readPayloadOrDecodePacket({
    file: packetBytes ? undefined : config.outputFile,
    packetBytes,
  });

  const payerPubkey = new web3.PublicKey(config.payer);
  const cpiAuthority = new web3.PublicKey(config.authority);

  const { accountStates: resp, payer: simulationPayer } = await simulatePayloadWithCompleteCrossChainFlow(
    payload,
    new web3.PublicKey(config.controllerProgramId),
    payerPubkey,
    cpiAuthority,
    1n // nonce
  );

  const permissionPda = await derivePermissionPda(
    address(config.controller),
    address(config.authority)
  );

  const controllerAuthority = await deriveControllerAuthorityPda(
    address(config.controller)
  );

  const expectedAtomicSwapConfig = {
    inputToken: address(config.inputTokenMint),
    outputToken: address(config.outputTokenMint),
    oracle: address(config.oracle),
    maxStaleness: config.maxStaleness,
    expiryTimestamp: config.expiryTimestamp,
    maxSlippageBps: config.maxSlippageBps,
    inputMintDecimals: config.inputMintDecimals,
    outputMintDecimals: config.outputMintDecimals,
    oraclePriceInverted: config.oraclePriceInverted,
    padding: new Uint8Array(107),
  };
  const integrationConfigData = integrationConfig("AtomicSwap", [
    expectedAtomicSwapConfig,
  ]);
  const integrationHash = computeIntegrationHash(integrationConfigData);
  const integrationPda = await deriveIntegrationPda(
    address(config.controller),
    integrationHash
  );

  // Assert common account changes
  // Use the actual payer from simulation (it generates a new keypair)
  assertInitializeIntegrationCommonAccountChanges(resp, {
    payer: simulationPayer.toString(),
    controller: config.controller,
    authority: config.authority,
    controllerProgramId: config.controllerProgramId,
    controllerAuthority,
    permissionPda,
    integrationPda: integrationPda.toString(),
    expectedHash: integrationHash,
  });

  // Assert input mint exists and does not change
  const inputMintResp = resp[config.inputTokenMint];
  assert(inputMintResp, "Input mint account should be in simulation response");
  assert(inputMintResp.after, "Input mint account should exist");
  
  // Validate input mint is owned by a Token program
  const inputMintOwner = inputMintResp.after.owner.toString();
  assert(
    inputMintOwner === TOKEN_PROGRAM_ID.toString() || inputMintOwner === TOKEN_2022_PROGRAM_ID.toString(),
    "Input mint should be owned by Token program or Token-2022 program"
  );

  assertNoAccountChanges(inputMintResp.before, inputMintResp.after);

  // Assert output mint exists and does not change
  const outputMintResp = resp[config.outputTokenMint];
  assert(outputMintResp, "Output mint account should be in simulation response");
  assert(outputMintResp.after, "Output mint account should exist");

  assertNoAccountChanges(outputMintResp.before, outputMintResp.after);
  
  // Validate output mint is owned by a Token program
  const outputMintOwner = outputMintResp.after.owner.toString();
  assert(
    outputMintOwner === TOKEN_PROGRAM_ID.toString() || outputMintOwner === TOKEN_2022_PROGRAM_ID.toString(),
    "Output mint should be owned by Token program or Token-2022 program"
  );

  // Assert oracle exists and does not change
  const oracleResp = resp[config.oracle];
  assert(oracleResp, "Oracle account should be in simulation response");
  assert(oracleResp.after, "Oracle account should exist");

  assertNoAccountChanges(oracleResp.before, oracleResp.after);

  // Assert integration is created
  assertIntegrationCreated(resp, integrationPda);

  // Validate integration data
  const integrationCodec = getIntegrationCodec();
  const integrationResp = resp[integrationPda];
  const [integration] = integrationCodec.read(integrationResp.after!.data, 1);

  // Validate integration-level fields
  validateCommonIntegrationFields(integration, config);

  // Validate integration state exists
  assert(integration.state, "Integration state should exist");
  if (integration.state.__kind !== "AtomicSwap") {
    throw new Error("Expected AtomicSwap state");
  }

  // Validate AtomicSwap state fields using typed Omit<> to explicitly exclude fields we don't check
  const actualAtomicSwapState = integration.state.fields[0];
  const expectedAtomicSwapState: Omit<typeof actualAtomicSwapState, never> = {
    amountBorrowed: 0n,
    lastBalanceA: 0n,
    lastBalanceB: 0n,
    padding: Buffer.from(new Uint8Array(8)),
    recipientTokenAPre: 0n,
    recipientTokenBPre: 0n,
  };
  assertContainsIn(expectedAtomicSwapState, actualAtomicSwapState);

  // Validate AtomicSwap config fields
  if (integration.config.__kind !== "AtomicSwap") {
    throw new Error("Expected AtomicSwap config");
  }
  const actualAtomicSwapConfig = integration.config.fields[0];
  assert(actualAtomicSwapConfig, "AtomicSwap config should exist");

  const expectedConfigForValidation: Omit<typeof actualAtomicSwapConfig, never> = {
    inputToken: address(config.inputTokenMint),
    outputToken: address(config.outputTokenMint),
    oracle: address(config.oracle),
    maxStaleness: config.maxStaleness,
    expiryTimestamp: config.expiryTimestamp,
    maxSlippageBps: config.maxSlippageBps,
    inputMintDecimals: config.inputMintDecimals,
    outputMintDecimals: config.outputMintDecimals,
    oraclePriceInverted: config.oraclePriceInverted,
    padding: Buffer.from(new Uint8Array(107)),
  };
  assertContainsIn(expectedConfigForValidation, actualAtomicSwapConfig);
}

const main = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config =
    readConfigFromFile<ControllerInitializeAtomicSwapIntegrationConfig>(
      args.config
    );

  // Support both file-based and Packet bytes-based payload reading
  const packetBytes = (args["packet-bytes"] || args.bytes) as string | undefined;
    
  await validateInitAtomicSwap(config, packetBytes);

  validateSuccess(args.file);
};

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
