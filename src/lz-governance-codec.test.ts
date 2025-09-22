import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToLzGovernanceSolanaPayload,
  convertLzGovernanceSolanaPayloadToInstruction,
  deriveExecutionContextAddress,
  LZ_CONTEXT_PLACEHOLDER,
  LZ_CPI_AUTHORITY_PLACEHOLDER,
  LZ_PAYER_PLACEHOLDER,
  serializeLzInstruction,
} from "./lz-governance-codec";

describe("lz-governance-codec", () => {
  it("should (de)serialize successfully", () => {
    const data = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    const programId = web3.PublicKey.unique();
    const accounts: web3.AccountMeta[] = [
      {
        pubkey: web3.PublicKey.unique(),
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: LZ_CONTEXT_PLACEHOLDER,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: LZ_CPI_AUTHORITY_PLACEHOLDER,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: LZ_PAYER_PLACEHOLDER,
        isSigner: true,
        isWritable: false,
      },
    ];
    const instruction = new web3.TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    const serializedInstruction = serializeLzInstruction(instruction);

    const cpiAuthority = web3.PublicKey.unique();
    const payer = web3.PublicKey.unique();
    const executionContextAddress = deriveExecutionContextAddress(payer);
    const expectedInstruction = {
      ...instruction,
      keys: [
        accounts[0],
        {
          ...accounts[1],
          pubkey: executionContextAddress,
        },
        {
          ...accounts[2],
          pubkey: cpiAuthority,
        },
        {
          ...accounts[3],
          pubkey: payer,
        },
      ],
    };
    const deserializedInstruction =
      convertLzGovernanceSolanaPayloadToInstruction(
        serializedInstruction,
        programId,
        cpiAuthority,
        payer
      );
    assert.deepEqual(deserializedInstruction, expectedInstruction);
  });
});
