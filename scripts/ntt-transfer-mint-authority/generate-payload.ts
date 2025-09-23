import fs from "fs";
import { Program, web3 } from "@coral-xyz/anchor-29";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor-29/dist/cjs/utils/token";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  SKY_WH_GOVERNANCE_PROGRAM_ID,
} from "../../src";
import { _NTT_IDL } from "./idl";

const utf8Encode = new TextEncoder();

const RPC_URL = "https://api.devnet.solana.com";

// Mainnet: STTUVCMPuNbk21y1J6nqEGXSQ8HKvFmFBKnCvKHTrWn
const NTT_MANAGER_ADDRESS = new web3.PublicKey(
  "BnxAbsogxcsFwUHHt787EQUP9DgD8jf1SA2BX4ERD8Rc"
);
// Config account for the above NTT Manager program
const NTT_CONFIG = web3.PublicKey.findProgramAddressSync(
  [utf8Encode.encode("config")],
  NTT_MANAGER_ADDRESS
)[0];

// Config owner, must be the payer in transferMintAuthority.
// This is typically the deployer of the NTT program.
// Mainnet: 66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj
const NTT_CONFIG_OWNER = new web3.PublicKey(
  "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr"
);
// Mainnet: USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA
const TOKEN_MINT = new web3.PublicKey(
  "HUEf4eo1utbchf6ZVvLcVRtV9iEpsqLVrXAbPSdHXafj"
);

// TODO update with the appropriate key for the LZ OFT
// Program
const NEW_MINT_AUTHORITY = new web3.PublicKey(
  "N7qfnBZgt4GcCgpa8mUPGCZEG9sCESDizWDFamwvv8v"
);

// hack around Anchor's wonky types by fixing the IDL as
// a constant, but typing it as mutable.
type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};
const NTT_IDL = _NTT_IDL as Mutable<typeof _NTT_IDL>;

const printSpell2TransferMintAuthorityPayload = async () => {
  const connection = new web3.Connection(RPC_URL);

  const nttProgram = new Program<typeof NTT_IDL>(NTT_IDL, NTT_MANAGER_ADDRESS, {
    connection,
  });

  const token_authority = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token_authority")],
    NTT_MANAGER_ADDRESS
  )[0];

  const transferMintAuthorityInstruction = await nttProgram.methods
    .transferMintAuthority({
      newMintAuthority: NEW_MINT_AUTHORITY,
    })
    .accountsStrict({
      payer: NTT_CONFIG_OWNER,
      config: NTT_CONFIG,
      tokenAuthority: token_authority,
      mint: TOKEN_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const transferMintAuthorityGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(
      SKY_WH_GOVERNANCE_PROGRAM_ID,
      transferMintAuthorityInstruction
    );

  fs.writeFileSync(
    "output.json",
    JSON.stringify(transferMintAuthorityGovernancePayload.toJSON().data)
  );

  console.log(
    "Transfer Mint Authority Instruction Payload: ",
    transferMintAuthorityGovernancePayload
  );
};

printSpell2TransferMintAuthorityPayload();
