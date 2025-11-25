import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzSolanaGovernancePayloadToInstruction,
  deserializeLzInstruction,
  getRpcEndpoint,
  LZ_PAYER_PLACEHOLDER,
  readAndValidateNetworkConfig,
  readArgs,
  readPayloadFile,
  simulateInstructions,
  validateSuccess,
} from "../../src";
import {
  getSsrOracleCodec,
  SSR_ORACLE_PROGRAM_ADDRESS,
} from "../../src/generated";
import { getUpdateOracleInstructionDataDecoder } from "../../src/generated/instructions/updateOracle";
import { ACTION, NETWORK_CONFIGS } from "./config";

const main = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);
  const args = readArgs(ACTION);
  const payload = readPayloadFile(args.file);

  // Use the payer from config for simulation
  const payerPubkey = new web3.PublicKey(config.payer);
  // Use the payer as the CPI authority (data provider authority) for simulation
  const cpiAuthorityPubkey = new web3.PublicKey(config.payer);

  // Deserialize the instruction from the payload
  const ssrOracleProgramId = new web3.PublicKey(SSR_ORACLE_PROGRAM_ADDRESS);

  // Check if the program exists on the network
  const programInfo = await connection.getAccountInfo(ssrOracleProgramId);
  if (!programInfo) {
    throw new Error(
      `SSR Oracle program ${SSR_ORACLE_PROGRAM_ADDRESS} not found on ${process.env.NETWORK || "devnet"}. ` +
        `The program must be deployed before validation can proceed.`
    );
  }

  const instruction = deserializeLzInstruction(ssrOracleProgramId, payload);

  // Replace the LZ_PAYER_PLACEHOLDER with the actual payer
  instruction.keys = instruction.keys.map((accountMeta) => {
    if (accountMeta.pubkey.equals(LZ_PAYER_PLACEHOLDER)) {
      accountMeta.pubkey = payerPubkey;
    }
    return accountMeta;
  });

  // Decode the instruction data to get expected values
  const instructionDataDecoder = getUpdateOracleInstructionDataDecoder();
  const instructionData = instructionDataDecoder.decode(instruction.data);
  const expectedRho = instructionData.rho;
  const expectedChi = instructionData.chi;
  const expectedSsr = instructionData.ssr;

  // Get account addresses from instruction keys
  // First account is dataProviderAuthority, second is oracle
  const dataProviderAuthorityPubkey = instruction.keys[0].pubkey;
  const oraclePubkey = instruction.keys[1].pubkey;

  // Simulate the instruction
  const resp = await simulateInstructions(connection, payerPubkey, [
    instruction,
  ]);

  // Assert payer does not change, except for lamports
  const payerResp = resp[payerPubkey.toString()];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert data provider authority does not change
  const dataProviderAuthorityResp =
    resp[dataProviderAuthorityPubkey.toString()];
  assertNoAccountChanges(
    dataProviderAuthorityResp.before,
    dataProviderAuthorityResp.after
  );

  // Assert oracle account changes correctly
  const oracleResp = resp[oraclePubkey.toString()];

  // Oracle account must exist
  assert.ok(oracleResp.after, "Oracle account must exist after execution");

  // Decode the oracle account
  const oracleCodec = getSsrOracleCodec();
  const oracleBefore = oracleResp.before
    ? oracleCodec.decode(oracleResp.before.data)
    : null;
  const oracleAfter = oracleCodec.decode(oracleResp.after.data);

  // Assert oracle account structure is valid
  assert.ok(oracleAfter, "Oracle account data must be valid");

  // Assert that immutable fields don't change
  if (oracleBefore) {
    assert.equal(
      oracleAfter.adminAuthority.toString(),
      oracleBefore.adminAuthority.toString(),
      "Admin authority should not change"
    );
    assert.equal(
      oracleAfter.dataProviderAuthority.toString(),
      oracleBefore.dataProviderAuthority.toString(),
      "Data provider authority should not change"
    );
    // assert.equal(
    //   oracleAfter.maxSsr.toString(),
    //   oracleBefore.maxSsr.toString(),
    //   "Max SSR should not change"
    // );
    assert.equal(
      oracleAfter.status,
      oracleBefore.status,
      "Status should not change"
    );
  }

  // Assert that the oracle data fields are updated correctly
  const oracleDataAfter = oracleAfter.data;

  const SCALING_FACTOR = 256n;
  const expectedRhoScaled = expectedRho * SCALING_FACTOR;
  const expectedChiScaled = expectedChi * SCALING_FACTOR;
  const expectedSsrScaled = expectedSsr * SCALING_FACTOR;

  assert.equal(
    oracleDataAfter.rho.toString(),
    expectedRhoScaled.toString(),
    "Rho should match expected value (scaled by 256)"
  );
  assert.equal(
    oracleDataAfter.chi.toString(),
    expectedChiScaled.toString(),
    "Chi should match expected value (scaled by 256)"
  );
  assert.equal(
    oracleDataAfter.ssr.toString(),
    expectedSsrScaled.toString(),
    "SSR should match expected value (scaled by 256)"
  );

  // Assert that lastUpdateTime and lastUpdateSlot are updated (should be greater than before if it existed)
  if (oracleBefore) {
    assert.ok(
      oracleAfter.lastUpdateTime >= oracleBefore.lastUpdateTime,
      "Last update time should be updated"
    );
    assert.ok(
      oracleAfter.lastUpdateSlot >= oracleBefore.lastUpdateSlot,
      "Last update slot should be updated"
    );
  } else {
    // If oracle didn't exist before, these should be set
    assert.ok(
      oracleAfter.lastUpdateTime > 0n,
      "Last update time should be set"
    );
    assert.ok(
      oracleAfter.lastUpdateSlot > 0n,
      "Last update slot should be set"
    );
  }

  validateSuccess(args.file);
};

main();
