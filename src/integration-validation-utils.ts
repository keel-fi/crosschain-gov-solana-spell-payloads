import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import { Integration, getIntegrationCodec } from "@keel-fi/svm-alm-controller";
import { assertNoAccountChanges } from "./simulation-assertions";
import { BaseControllerIntegrationConfig } from "./controller-types";
import { bytesToUtf8TrimNull } from "./utils";

type SimulateResponse = Record<
  string,
  {
    before: web3.AccountInfo<Buffer> | null;
    after: web3.AccountInfo<Buffer> | null;
  }
>;

/**
 * Assert common account changes for integration initialization:
 * - Payer does not change (except for lamports)
 * - Controller does not change
 * - Controller authority does not change
 * - Authority does not change
 * - Permission does not change (with optional check if permission exists)
 * - Controller program does not change
 * - Integration controller and hash fields match expected values
 */
export const assertInitializeIntegrationCommonAccountChanges = (
  resp: SimulateResponse,
  config: {
    payer: string;
    controller: string;
    authority: string;
    controllerProgramId: string;
    controllerAuthority: string;
    permissionPda: string;
    integrationPda: string;
    expectedHash: Buffer | Uint8Array;
<<<<<<< HEAD
  }
) => {
  // Assert payer does not change, except for lamports
  // Note: payer should be the actual simulation payer (simulationPayer.toString())
=======
    skipSurfpoolChecks?: boolean;
  }
) => {
  // Assert payer does not change, except for lamports
>>>>>>> main
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
<<<<<<< HEAD
  assertNoAccountChanges(controllerResp.before, controllerResp.after);
=======
  if (!config.skipSurfpoolChecks) {
    assertNoAccountChanges(controllerResp.before, controllerResp.after);
  }
>>>>>>> main

  // Assert controller authority does not change
  const controllerAuthorityResp = resp[config.controllerAuthority];
  assertNoAccountChanges(
    controllerAuthorityResp.before,
    controllerAuthorityResp.after
  );

<<<<<<< HEAD
  // Assert permission does not change
  const permissionResp = resp[config.permissionPda];
  assertNoAccountChanges(permissionResp.before, permissionResp.after);
  
  // Assert controller program does not change
  const controllerProgramResp = resp[config.controllerProgramId];
  assertNoAccountChanges(
    controllerProgramResp.before,
    controllerProgramResp.after
  );

=======
>>>>>>> main
  // Assert authority does not change
  const authorityResp = resp[config.authority];
  assertNoAccountChanges(authorityResp.before, authorityResp.after);

<<<<<<< HEAD
=======
  // Assert permission does not change
  const permissionResp = resp[config.permissionPda];
  if (!config.skipSurfpoolChecks) {
    assertNoAccountChanges(permissionResp.before, permissionResp.after);
  }

  // Assert controller program does not change
  const controllerProgramResp = resp[config.controllerProgramId];
  if (!config.skipSurfpoolChecks) {
    assertNoAccountChanges(
      controllerProgramResp.before,
      controllerProgramResp.after
    );
  }

>>>>>>> main
  // Assert integration is created and validate controller and hash fields
  const integrationResp = resp[config.integrationPda];
  assert(integrationResp.after, "Integration should be created");

  // Decode integration account data
  const integrationCodec = getIntegrationCodec();
  const [integration] = integrationCodec.read(integrationResp.after!.data, 1);

  // Validate integration controller matches expected controller
  assert.equal(
    integration.controller.toString(),
    config.controller,
    "Integration controller should match config"
  );

  // Validate integration hash matches expected hash
  const expectedHashBuffer = Buffer.from(config.expectedHash);
  const actualHashBuffer = Buffer.from(integration.hash);
  assert(
    expectedHashBuffer.equals(actualHashBuffer),
    "Integration hash should match expected hash"
  );
};

/**
 * Validate common integration-level fields that are shared across all integrations.
 * @param integration - The decoded integration object
 * @param config - The config object with expected values
 */
export const validateCommonIntegrationFields = (
  integration: Integration,
  config: BaseControllerIntegrationConfig
) => {
  assert.equal(integration.status, config.status, "Status should match config");

  const descriptionStr = bytesToUtf8TrimNull(integration.description);
  assert.equal(
    descriptionStr,
    config.description,
    "Description should match config"
  );

  assert.equal(
    integration.rateLimitSlope.toString(),
    config.rateLimitSlope.toString(),
    "Rate limit slope should match config"
  );
  assert.equal(
    integration.rateLimitMaxOutflow.toString(),
    config.rateLimitMaxOutflow.toString(),
    "Rate limit max outflow should match config"
  );
  assert.equal(
    integration.permitLiquidation,
    config.permitLiquidation,
    "Permit liquidation should match config"
  );

  assert.equal(
    integration.rateLimitOutflowAmountAvailable.toString(),
    config.rateLimitMaxOutflow.toString(),
    "Rate limit max outflow amount available should match config"
  );
  assert.equal(
    integration.rateLimitRemainder.toString(),
    "0",
    "Rate limit remainder should be 0"
  );
};

/**
 * Assert that an integration PDA is created in the simulation response.
 */
export const assertIntegrationCreated = (
  resp: SimulateResponse,
  integrationPda: string
) => {
  const integrationResp = resp[integrationPda];
  assert(integrationResp.after, "Integration should be created");
};

/**
 * Checks if `sub` is a sub-object of `sup`.
 * Uses deep strict equality for each property in `sub`.
 * @param sub - Partial object containing expected values
 * @param sup - Full object to check against
<<<<<<< HEAD
 * @param options - Optional configuration
 * @param options.message - Optional custom error message prefix
 * @param options.skipKeys - Optional array of keys to skip (useful for fields that are null in config, meaning no change expected)
=======
 * @param message - Optional custom error message prefix
>>>>>>> main
 */
export function assertContainsIn<T extends object>(
  sub: Partial<T>,
  sup: T,
<<<<<<< HEAD
  options?: {
    message?: string;
    skipKeys?: string[];
  }
) {
  const skipKeys = options?.skipKeys ?? [];
  for (const [key, value] of Object.entries(sub)) {
    if (skipKeys.includes(key)) {
      continue;
    }
    assert.deepStrictEqual(
      sup[key as keyof T],
      value,
      options?.message || `Property "${key}" mismatch`
=======
  message?: string
) {
  for (const [key, value] of Object.entries(sub)) {
    assert.deepStrictEqual(
      sup[key as keyof T],
      value,
      message || `Property "${key}" mismatch`
>>>>>>> main
    );
  }
}
