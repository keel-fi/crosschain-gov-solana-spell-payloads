// Generates a payload for updating the Solana PSM SSR via crosschain governance message.

import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  createSetRatesInstruction,
  serializeLzInstruction,
  SOLANA_PSM_PROGRAM_ID,
} from "../../src";

const PSM_SWAP_POOL = new web3.PublicKey(
  "BnoGrhqDRcGuMCzkLiyijV3RSYRaHG8wNdxoQpEcsHNQ"
);
const PERMISSION_ACCOUNT = new web3.PublicKey(
  "AMqte9K2XF2b4R1TEyCS6soepwCCWvMjcsg64Y6VZJa3"
);
const PERMISSION_AUTHORITY = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);

const NEW_SSR = 1_000_000_100_200_000_000_000_000_000n;
const NEW_RHO = 1_757_000_000n;
const NEW_CHI = 1_060_000_000_000_000_000_000_000_000n;

const printPsmSSRUpdatePayload = () => {
  const updateInstruction = createSetRatesInstruction(
    SOLANA_PSM_PROGRAM_ID,
    PSM_SWAP_POOL,
    PERMISSION_ACCOUNT,
    PERMISSION_AUTHORITY,
    NEW_SSR,
    NEW_RHO,
    NEW_CHI
  );

  // NOTE: LZ EVM OAPP only requires the instruction data (sans program ID) and combines
  // the rest of the parameters. So we only need to call `serializeLzInstruction` to get
  // the payload.
  const updateLzGovernancePayload = serializeLzInstruction(updateInstruction);

  fs.writeFileSync(
    "output.json",
    JSON.stringify(updateLzGovernancePayload.toJSON().data)
  );

  console.log("Upgrade Instruction Payload: ", updateLzGovernancePayload);
};

printPsmSSRUpdatePayload();
