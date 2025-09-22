import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertLzGovernanceSolanaPayloadToInstruction,
  RedemptionRateCurveLayout,
  simulateInstructions,
  SOLANA_PSM_PROGRAM_ID,
  TokenSwapLayout,
} from "../../src";

const RPC_URL = "https://api.devnet.solana.com";

const PAYLOAD = Buffer.from([
  0, 3, 160, 80, 83, 193, 63, 246, 248, 210, 165, 20, 194, 95, 15, 31, 31, 234,
  63, 38, 204, 126, 141, 90, 89, 112, 32, 59, 215, 175, 81, 195, 104, 121, 0, 1,
  139, 16, 20, 58, 94, 91, 134, 40, 92, 118, 46, 200, 145, 158, 76, 105, 174,
  52, 40, 126, 20, 151, 143, 223, 190, 166, 82, 9, 59, 189, 226, 0, 0, 0, 37,
  249, 146, 67, 177, 163, 234, 226, 85, 154, 57, 97, 164, 16, 202, 67, 147, 213,
  244, 142, 190, 63, 92, 141, 154, 197, 50, 67, 68, 24, 132, 119, 1, 0, 6, 0, 0,
  36, 6, 91, 105, 94, 14, 66, 46, 59, 3, 0, 0, 0, 0, 64, 177, 185, 104, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 164, 238, 135, 72, 36, 187, 207, 108, 3,
  0, 0, 0, 0,
]);

const PAYER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);

const PSM_SWAP_POOL = "BnoGrhqDRcGuMCzkLiyijV3RSYRaHG8wNdxoQpEcsHNQ";
const PERMISSION_ACCOUNT = "AMqte9K2XF2b4R1TEyCS6soepwCCWvMjcsg64Y6VZJa3";

const EXPECTED_SSR = 1_000_000_100_200_000_000_000_000_000n;
const EXPECTED_RHO = 1_757_000_000n;
const EXPECTED_CHI = 1_060_000_000_000_000_000_000_000_000n;

const main = async () => {
  const connection = new web3.Connection(RPC_URL);
  const instruction = convertLzGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    SOLANA_PSM_PROGRAM_ID,
    // no CPI authority required, but may be required for mainnet
    web3.PublicKey.default,
    PAYER
  );

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  const permissionAccount = resp[PERMISSION_ACCOUNT];
  assertNoAccountChanges(permissionAccount.before, permissionAccount.after);

  // check rates updated
  const tokenSwapResp = resp[PSM_SWAP_POOL];
  const dataAfter = Buffer.from(tokenSwapResp.after.data[0], "base64");
  const bytesBefore = new Uint8Array(tokenSwapResp.before.data);
  const bytesAfter = new Uint8Array(dataAfter);
  const tokenSwapBefore = TokenSwapLayout.decode(bytesBefore);
  const tokenSwapAfter = TokenSwapLayout.decode(bytesAfter);
  // Assert curve parameters matches our expected changes
  const redemptionCurveBefore = RedemptionRateCurveLayout.decode(
    tokenSwapBefore.curveParameters
  );
  const redemptionCurveAfter = RedemptionRateCurveLayout.decode(
    tokenSwapAfter.curveParameters
  );
  assert.equal(redemptionCurveBefore.maxSsr, redemptionCurveAfter.maxSsr);
  assert.equal(redemptionCurveAfter.rho, EXPECTED_RHO);
  assert.equal(redemptionCurveAfter.ssr, EXPECTED_SSR);
  assert.equal(redemptionCurveAfter.chi, EXPECTED_CHI);

  // Assert all values other than `curveParameters` did not change
  assert.equal(tokenSwapBefore.version, tokenSwapAfter.version);
  assert.equal(tokenSwapBefore.isInitialized, tokenSwapAfter.isInitialized);
  assert.equal(tokenSwapBefore.bumpSeed, tokenSwapAfter.bumpSeed);
  assert.equal(
    tokenSwapBefore.poolTokenProgramId.toString(),
    tokenSwapAfter.poolTokenProgramId.toString()
  );
  assert.equal(
    tokenSwapBefore.tokenAccountA.toString(),
    tokenSwapAfter.tokenAccountA.toString()
  );
  assert.equal(
    tokenSwapBefore.tokenAccountB.toString(),
    tokenSwapAfter.tokenAccountB.toString()
  );
  assert.equal(
    tokenSwapBefore.tokenPool.toString(),
    tokenSwapAfter.tokenPool.toString()
  );
  assert.equal(
    tokenSwapBefore.mintA.toString(),
    tokenSwapAfter.mintA.toString()
  );
  assert.equal(
    tokenSwapBefore.mintB.toString(),
    tokenSwapAfter.mintB.toString()
  );
  assert.equal(
    tokenSwapBefore.feeAccount.toString(),
    tokenSwapAfter.feeAccount.toString()
  );
  assert.equal(
    tokenSwapBefore.tradeFeeNumerator,
    tokenSwapAfter.tradeFeeNumerator
  );
  assert.equal(
    tokenSwapBefore.tradeFeeDenominator,
    tokenSwapAfter.tradeFeeDenominator
  );
  assert.equal(
    tokenSwapBefore.ownerTradeFeeNumerator,
    tokenSwapAfter.ownerTradeFeeNumerator
  );
  assert.equal(
    tokenSwapBefore.ownerTradeFeeDenominator,
    tokenSwapAfter.ownerTradeFeeDenominator
  );
  assert.equal(
    tokenSwapBefore.ownerWithdrawFeeNumerator,
    tokenSwapAfter.ownerWithdrawFeeNumerator
  );
  assert.equal(
    tokenSwapBefore.ownerWithdrawFeeDenominator,
    tokenSwapAfter.ownerWithdrawFeeDenominator
  );
  assert.equal(
    tokenSwapBefore.hostFeeNumerator,
    tokenSwapAfter.hostFeeNumerator
  );
  assert.equal(
    tokenSwapBefore.hostFeeDenominator,
    tokenSwapAfter.hostFeeDenominator
  );
  assert.equal(tokenSwapBefore.curveType, tokenSwapAfter.curveType);
};

main();
