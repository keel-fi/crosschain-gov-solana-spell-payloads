// Generates a payload for updating the Solana PSM SSR via crosschain governance message.

import fs from "fs";
import { web3 } from "@coral-xyz/anchor";
import {
  bigintToU128LEBuffer,
  convertInstructionToLzGovernanceSolanaPayload,
} from "../src";

const SOLANA_PSM_PROGRAM_ID = new web3.PublicKey("TODO");

// https://github.com/nova-dot-gg/nova-psm/blob/e22a6edc2ed5be35eafc6f215ba8ca87610ba433/program/src/instruction.rs#L370
const SOLANA_PSM_SET_RATES_DISC = 6;

const PSM_SWAP_POOL = new web3.PublicKey("TODO");
const PERMISSION_ACCOUNT = new web3.PublicKey("TODO");
const PERMISSION_AUTHORITY = new web3.PublicKey("TODO");

/**
 * Construct a SetRates instruction for the Solana PSM.
 * @param swapAccount
 * @param permissionAccount
 * @param authority
 * @param ssr
 * @param rho
 * @param chi
 * @returns
 */
const getPsmSsrUpdateInstruction = (
  swapAccount: web3.PublicKey,
  permissionAccount: web3.PublicKey,
  authority: web3.PublicKey,
  ssr: bigint,
  rho: bigint,
  chi: bigint
): web3.TransactionInstruction => {
  // 1 - ix discriminator
  // 3 * 16 - ssr, rho, chi
  const data = Buffer.alloc(49);
  data.set([SOLANA_PSM_SET_RATES_DISC], 0);
  const ssrBuf = bigintToU128LEBuffer(ssr);
  data.set(ssrBuf, 1);
  const rhoBuf = bigintToU128LEBuffer(rho);
  data.set(rhoBuf, 17);
  const chiBuf = bigintToU128LEBuffer(chi);
  data.set(chiBuf, 33);

  return new web3.TransactionInstruction({
    keys: [
      { pubkey: swapAccount, isWritable: true, isSigner: false },
      { pubkey: permissionAccount, isWritable: false, isSigner: false },
      { pubkey: authority, isWritable: false, isSigner: true },
    ],
    programId: SOLANA_PSM_PROGRAM_ID,
    data,
  });
};

const printPsmSSRUpdatePayload = () => {
  const updateInstruction = getPsmSsrUpdateInstruction(
    PSM_SWAP_POOL,
    PERMISSION_ACCOUNT,
    PERMISSION_AUTHORITY,
    0n,
    0n,
    0n
  );

  const ORIGIN_CALLER = Buffer.alloc(32);
  const updateLzGovernancePayload =
    convertInstructionToLzGovernanceSolanaPayload(
      ORIGIN_CALLER,
      updateInstruction
    );
  fs.writeFileSync(
    "output.json",
    JSON.stringify(updateLzGovernancePayload.toJSON().data)
  );
  console.log("Upgrade Instruction Payload: ", updateLzGovernancePayload);
};

printPsmSSRUpdatePayload();
