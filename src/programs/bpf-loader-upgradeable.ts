// TS SDK for the BPFLoaderUpgradable program

import { web3 } from "@coral-xyz/anchor";

const LOADER_V3_PROGRAM_ADDRESS = new web3.PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);
const UPGRADE_DISCRIMINATOR = 3;
export const getUpgradeInstruction = (
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
      { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: authority, isWritable: false, isSigner: true },
    ],
    programId: LOADER_V3_PROGRAM_ADDRESS,
    data: Buffer.from([UPGRADE_DISCRIMINATOR, 0, 0, 0]),
  });

  return ix;
};

const EXTEND_DISCRIMINATOR = 6;
export const getExtendProgramInstruction = (
  programAddress: web3.PublicKey,
  programDataAccount: web3.PublicKey,
  payer: web3.PublicKey,
  additionalBytes: number
) => {
  const data = Buffer.alloc(4 + 4);
  data.writeUInt32LE(EXTEND_DISCRIMINATOR, 0);   // discriminator
  data.writeUInt32LE(additionalBytes, 4);       // payload
  const ix = new web3.TransactionInstruction({
    keys: [
      { pubkey: programDataAccount, isWritable: true, isSigner: false },
      { pubkey: programAddress, isWritable: true, isSigner: false },
      { pubkey: web3.SystemProgram.programId, isWritable: false, isSigner: false },
      { pubkey: payer, isWritable: true, isSigner: true },
    ],
    programId: LOADER_V3_PROGRAM_ADDRESS,
    data: data,
  });

  return ix;
};