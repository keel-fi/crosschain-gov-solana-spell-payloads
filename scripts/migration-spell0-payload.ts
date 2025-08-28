import { web3 } from "@coral-xyz/anchor";
import { convertInstructionToWhGovernanceSolanaPayload } from "../src/wh-governance-codec";
// Creates a payload for upgrading the Solana NTT Manager program.

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

// TODO get values and verify correctness
const NTT_MANAGER_ADDRESS = new web3.PublicKey(
  "STTUVCMPuNbk21y1J6nqEGXSQ8HKvFmFBKnCvKHTrWn"
);
const NTT_MANAGER_PROGRAM_DATA_ADDRESS = new web3.PublicKey(
  "CKKGtQ2m1t4gHUz2tECGQNqaaFtGsoc9eBjzm61qqV2Q"
);
const NTT_MANAGER_UPGRADE_AUTHORITY = new web3.PublicKey(
  "66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj"
);
const NEW_PROGRAM_BUFFER = new web3.PublicKey("TODO");
const printSpell0NttUpgradePayload = () => {
  const upgradeInstruction = getUpgradeInstruction(
    NTT_MANAGER_ADDRESS,
    NTT_MANAGER_PROGRAM_DATA_ADDRESS,
    NEW_PROGRAM_BUFFER,
    NTT_MANAGER_UPGRADE_AUTHORITY,
    // Use the authority as the "spill" account for
    // excess lamports
    NTT_MANAGER_UPGRADE_AUTHORITY
  );
  const upgradeGovernancePayload =
    convertInstructionToWhGovernanceSolanaPayload(upgradeInstruction);
  console.log("Upgrade Instruction Payload: ", upgradeGovernancePayload);
};

printSpell0NttUpgradePayload();
