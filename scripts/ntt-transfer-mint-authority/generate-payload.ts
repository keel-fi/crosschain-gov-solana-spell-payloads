import fs from "fs";
import { Program, web3 } from "@coral-xyz/anchor-29";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor-29/dist/cjs/utils/token";
import {
  convertInstructionToWhGovernanceSolanaPayload,
  getRpcEndpoint,
  readAndValidateNetworkConfig,
  WH_OWNER_SENTINEL_KEY,
} from "../../src";
import { _NTT_IDL } from "./idl";
import { NETWORK_CONFIGS } from "./config";

// Hack around Anchor's wonky types by fixing the IDL as
// a constant, but typing it as mutable.
type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};
const NTT_IDL = _NTT_IDL as Mutable<typeof _NTT_IDL>;

const printSpell2TransferMintAuthorityPayload = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const rpcUrl = getRpcEndpoint();
  const connection = new web3.Connection(rpcUrl);

  const nttProgramIdPubkey = new web3.PublicKey(config.nttProgramId);
  const nttProgram = new Program<typeof NTT_IDL>(NTT_IDL, nttProgramIdPubkey, {
    connection,
  });

  // Config account for the above NTT Manager program
  const nttConfig = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    nttProgramIdPubkey
  )[0];
  const tokenAuthority = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token_authority")],
    nttProgramIdPubkey
  )[0];

  const transferMintAuthorityInstruction = await nttProgram.methods
    .transferMintAuthority({
      newMintAuthority: new web3.PublicKey(config.newAuthority),
    })
    .accountsStrict({
      payer: WH_OWNER_SENTINEL_KEY,
      config: nttConfig,
      tokenAuthority: tokenAuthority,
      mint: new web3.PublicKey(config.tokenMint),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const transferMintAuthorityGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(
      new web3.PublicKey(config.governanceProgramId),
      transferMintAuthorityInstruction
    );

  fs.writeFileSync(
    "output.json",
    JSON.stringify(transferMintAuthorityGovernancePayload.toJSON().data)
  );

  console.log("Instruction Payload: ", transferMintAuthorityGovernancePayload);
};

printSpell2TransferMintAuthorityPayload();
