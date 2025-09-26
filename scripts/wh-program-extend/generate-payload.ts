// Creates a payload for WH governance to extend a program.
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  getExtendProgramInstruction,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
} from "../../src";

const PROGRAM_ADDRESS = new web3.PublicKey(
  "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc"
);
const PROGRAM_DATA_ADDRESS = new web3.PublicKey(
  "EsBqEQkFSsiRifBgQmtoXJheDJfYEMhgHSETn2MKgGV4"
);

const PAYER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);

const ADDITIONAL_BYTES = 1_000;

const printSpellExtendPayload = () => {
  const extendInstruction = getExtendProgramInstruction(
    PROGRAM_ADDRESS,
    PROGRAM_DATA_ADDRESS,
    PAYER,
    ADDITIONAL_BYTES
  );

  const extendGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(
      SKY_WH_GOVERNANCE_PROGRAM_ID,
      extendInstruction
    );

  fs.writeFileSync(
    "output.json",
    JSON.stringify(extendGovernancePayload.toJSON().data)
  );
  
  console.log("Extend Instruction Payload: ", extendGovernancePayload);
};

printSpellExtendPayload();