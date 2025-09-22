import { web3 } from "@coral-xyz/anchor";

/**
 * Convert a SimulatedTransactionAccountInfo to AccountInfo
 */
export const convertSimulationToAccountInfo = (
  sim: web3.SimulatedTransactionAccountInfo
): web3.AccountInfo<Buffer> => {
  return {
    executable: sim.executable,
    owner: new web3.PublicKey(sim.owner),
    lamports: sim.lamports,
    data: Buffer.from(sim.data[0], "base64"),
    rentEpoch: sim.rentEpoch,
  };
};
