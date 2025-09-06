// Creates a payload for WH governance to upgrade a program.
import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
} from "../src";

const LOADER_V3_PROGRAM_ADDRESS = new web3.PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);
const UPGRADE_DISCRIMINATOR = 3;
const getUpgradeInstruction = (
  programAddress: web3.PublicKey,
  programDataAccount: web3.PublicKey,
  bufferAccount: web3.PublicKey,
  authority: web3.PublicKey,
  spillAccount: web3.PublicKey
) => {
  const ix = new web3.TransactionInstruction({
    keys: [
      { pubkey: programDataAccount, isWritable: true, isSigner: false },
      { pubkey: programAddress, isWritable: true, isSigner: false },
      { pubkey: bufferAccount, isWritable: true, isSigner: false },
      { pubkey: spillAccount, isWritable: true, isSigner: false },
      { pubkey: web3.SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isWritable: true, isSigner: false },
      { pubkey: authority, isWritable: false, isSigner: true },
    ],
    programId: LOADER_V3_PROGRAM_ADDRESS,
    data: Buffer.from([UPGRADE_DISCRIMINATOR, 0, 0, 0]),
  });

  return ix;
};

const PROGRAM_ADDRESS = new web3.PublicKey(
  "H3BpbuheXwBnfxjb2L66mxZ9nFhRmUentYwQDspd6yJ9"
);
const PROGRAM_DATA_ADDRESS = new web3.PublicKey(
  "G9PGxifnjuhcJHtVV4XMgRMY3ZsWyvyQsKHqVnMf4XRB"
);
const PROGRAM_UPGRADE_AUTHORITY = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);
const NEW_PROGRAM_BUFFER = new web3.PublicKey(
  "UGrgktHeUccU3dujEWrEfYaEv9x79K77uooEdadkUVD"
);

const printSpellUpgradePayload = () => {
  const upgradeInstruction = getUpgradeInstruction(
    PROGRAM_ADDRESS,
    PROGRAM_DATA_ADDRESS,
    NEW_PROGRAM_BUFFER,
    PROGRAM_UPGRADE_AUTHORITY,
    // Use the authority as the "spill" account for
    // excess lamports
    PROGRAM_UPGRADE_AUTHORITY
  );
  const upgradeGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(
      SKY_WH_GOVERNANCE_PROGRAM_ID,
      upgradeInstruction
    );
  fs.writeFileSync(
    "output.json",
    JSON.stringify(upgradeGovernancePayload.toJSON().data)
  );
  console.log("Upgrade Instruction Payload: ", upgradeGovernancePayload);
};

printSpellUpgradePayload();
