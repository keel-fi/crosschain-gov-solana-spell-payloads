import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import { Integration } from "@keel-fi/svm-alm-controller";
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
    skipSurfpoolChecks?: boolean;
  }
) => {
  // Assert payer does not change, except for lamports
  const payerResp = resp[config.payer];
  assertNoAccountChanges(payerResp.before, payerResp.after, true);

  // Assert controller does not change
  const controllerResp = resp[config.controller];
  if (!config.skipSurfpoolChecks) {
    assertNoAccountChanges(controllerResp.before, controllerResp.after);
  }

  // Assert controller authority does not change
  const controllerAuthorityResp = resp[config.controllerAuthority];
  assertNoAccountChanges(
    controllerAuthorityResp?.before,
    controllerAuthorityResp?.after
  );

  // Assert authority does not change
  const authorityResp = resp[config.authority];
  assertNoAccountChanges(authorityResp.before, authorityResp.after);

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

  const descriptionStr = integration.description
    .toString()
    .replace(/\0+$/g, "");
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
