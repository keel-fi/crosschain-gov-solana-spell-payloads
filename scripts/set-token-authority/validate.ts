import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  assertNoAccountChanges,
  convertWhGovernanceSolanaPayloadToInstruction,
  simulateInstructions,
} from "../../src";
import { unpackMint } from "@solana/spl-token";

const RPC_URL = "https://api.devnet.solana.com";

const PAYLOAD = Buffer.from([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112,
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 116,
  45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 174, 245,
  52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 6, 221, 246, 225,
  215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237,
  95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169, 0, 2, 164, 250, 210,
  120, 92, 92, 54, 29, 152, 56, 87, 230, 68, 80, 111, 192, 142, 156, 49, 67,
  248, 15, 253, 239, 227, 228, 149, 171, 104, 164, 160, 233, 0, 1, 69, 179, 6,
  49, 101, 155, 184, 159, 227, 246, 178, 126, 34, 103, 108, 82, 61, 233, 148,
  174, 95, 247, 171, 97, 57, 32, 251, 194, 69, 218, 94, 247, 1, 0, 0, 35, 6, 1,
  1, 255, 193, 161, 53, 8, 52, 143, 122, 143, 211, 169, 219, 249, 88, 172, 134,
  35, 28, 115, 30, 133, 210, 76, 252, 137, 107, 244, 56, 111, 146, 20, 136,
]);

const PAYER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);
const TOKEN_MINT = new web3.PublicKey(
  "C71h4tuPk6f72bAM2D8L2nwH3XtJB6awsw7H6xmNDo3E"
);
const CURRENT_AUTHORITY = new web3.PublicKey(
  "5h5TjxxZRoD2rtLkqCtt4uTmFVXjsdpEydqa2B5TZJVU"
);
const EXPECTED_AUTHORITY = new web3.PublicKey(
  "JDNDBYaXdNiD7peLgRP3TZKwkeCJ3QEFwYkHk6DWbb75"
);

const main = async () => {
  const connection = new web3.Connection(RPC_URL);
  const instruction = convertWhGovernanceSolanaPayloadToInstruction(
    PAYLOAD,
    PAYER,
    CURRENT_AUTHORITY
  );

  const resp = await simulateInstructions(connection, PAYER, [instruction]);

  // Previous authority should not change
  const prevAuthority = resp[CURRENT_AUTHORITY.toString()];
  assertNoAccountChanges(prevAuthority.before, prevAuthority.after);

  // Assert new authority did not change
  const newAuthorityResp = resp[EXPECTED_AUTHORITY.toString()];
  assertNoAccountChanges(newAuthorityResp?.before, newAuthorityResp?.after);

  // check mint values
  const mintResp = resp[TOKEN_MINT.toString()];
  const mintBefore = unpackMint(TOKEN_MINT, mintResp.before);
  const mintAfter = unpackMint(TOKEN_MINT, mintResp.after);

  // Assert values other than freeze authority did not change
  assert.equal(mintAfter.decimals, mintBefore.decimals);
  assert.equal(mintAfter.isInitialized, mintBefore.isInitialized);
  assert.equal(
    mintAfter.mintAuthority.toString(),
    mintBefore.mintAuthority.toString()
  );
  assert.equal(mintAfter.supply, mintBefore.supply);
  assert.deepEqual(mintAfter.tlvData, mintBefore.tlvData);

  // Assert freeze authority changed as expected
  assert.equal(
    mintAfter.freezeAuthority.toString(),
    EXPECTED_AUTHORITY.toString()
  );
};

main();
