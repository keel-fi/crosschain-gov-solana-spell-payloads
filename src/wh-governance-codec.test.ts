import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhSolanaGovernancePayload,
  convertWhSolanaGovernancePayloadToInstruction,
  WH_OWNER_SENTINEL_KEY,
  WH_PAYER_SENTINEL_KEY,
} from "./wh-governance-codec";

describe("wh-governance-codec", () => {
  it("should (de)serialize successfully", () => {
    const governanceProgramId = web3.PublicKey.unique();
    const data = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    const programId = web3.PublicKey.unique();
    const accounts: web3.AccountMeta[] = [
      {
        pubkey: web3.PublicKey.unique(),
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: WH_OWNER_SENTINEL_KEY,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: WH_PAYER_SENTINEL_KEY,
        isSigner: true,
        isWritable: false,
      },
    ];
    const instruction = new web3.TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    const serializedInstruction = convertInstructionToWhSolanaGovernancePayload(
      governanceProgramId,
      instruction
    );

    const owner = web3.PublicKey.unique();
    const payer = web3.PublicKey.unique();
    const expectedInstruction = {
      ...instruction,
      keys: [
        accounts[0],
        {
          ...accounts[1],
          pubkey: owner,
        },
        {
          ...accounts[2],
          pubkey: payer,
        },
      ],
    };
    const deserializedInstruction =
      convertWhSolanaGovernancePayloadToInstruction(
        serializedInstruction,
        payer,
        owner
      );
    assert.deepEqual(deserializedInstruction, expectedInstruction);
  });
});
