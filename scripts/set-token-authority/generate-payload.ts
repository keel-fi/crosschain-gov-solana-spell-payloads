import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  AuthorityType,
  TOKEN_PROGRAM_ID,
  createSetAuthorityInstruction,
} from "@solana/spl-token";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
} from "../../src";

// USDS Freeze Authority: 66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj
// NOTE: When updating for mainnet, the authority is the WH Governance
// "Owner", so we must use the `owner` sentinel key.

const TOKEN_MINT = new web3.PublicKey(
  "C71h4tuPk6f72bAM2D8L2nwH3XtJB6awsw7H6xmNDo3E"
);
const CURRENT_AUTHORITY = new web3.PublicKey(
  "5h5TjxxZRoD2rtLkqCtt4uTmFVXjsdpEydqa2B5TZJVU"
);
const NEW_AUTHORITY = new web3.PublicKey(
  "JDNDBYaXdNiD7peLgRP3TZKwkeCJ3QEFwYkHk6DWbb75"
);

const TOKEN_PROGRAM = TOKEN_PROGRAM_ID;

const generateSetTokenAuthorityPayload = () => {
  const setAuthorityInstruction = createSetAuthorityInstruction(
    TOKEN_MINT,
    // WH_OWNER_SENTINEL_KEY, use for mainnet
    CURRENT_AUTHORITY,
    AuthorityType.FreezeAccount,
    NEW_AUTHORITY,
    [],
    TOKEN_PROGRAM
  );

  const payload = convertInstructionToWhGovernanceSolanaPayload(
    SKY_WH_GOVERNANCE_PROGRAM_ID,
    setAuthorityInstruction
  );

  fs.writeFileSync("output.json", JSON.stringify(payload.toJSON().data));

  console.log("Instruction Payload: ", payload);
};

generateSetTokenAuthorityPayload();
