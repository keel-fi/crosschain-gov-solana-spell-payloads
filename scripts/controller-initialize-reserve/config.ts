import {
  ReserveStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  Network,
  PYUSD_MINT,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  USDG_MINT,
  CASH_MINT,
} from "../../src";

export const ACTION = "controller-initialize-reserve";

export type Stablecoin = "USDG" | "PYUSD" | "CASH";

type ControllerInitializeReserve = {
  controllerProgramId: string;
  // Controller that the Reserve applies to
  controller: string;
  // Authority that has permission to initialize the reserve
  authority: string;
  // Mint address for the reserve
  mint: string;
  payer: string;
  // Reserve status
  status: ReserveStatus;
  // Rate limit slope
  rateLimitSlope: bigint;
  // Rate limit max outflow
  rateLimitMaxOutflow: bigint;
};

type NetworkConfigs = Record<Network, Record<Stablecoin, ControllerInitializeReserve>>;

export const NETWORK_CONFIGS: NetworkConfigs = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      mint: "", // TODO: update to actual USDG mint
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: ReserveStatus.Active,
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      mint: "", // TODO: update to actual PYUSD mint
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: ReserveStatus.Active,
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      mint: "", // TODO: update to actual CASH mint
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: ReserveStatus.Active,
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
    },
  },
  mainnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      mint: USDG_MINT,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: ReserveStatus.Active,
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      mint: PYUSD_MINT,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: ReserveStatus.Active,
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      mint: CASH_MINT,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: ReserveStatus.Active,
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
    },
  },
};