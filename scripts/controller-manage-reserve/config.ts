import {
  ReserveStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  NetworkStablecoinConfig,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  USDG_MINT,
  PYUSD_MINT,
  CASH_MINT,
} from "../../src";

export const ACTION = "controller-manage-reserve";

type ControllerManageReserve = {
  controllerProgramId: string;
  // Controller that the Reserve applies to
  controller: string;
  // Authority that has permission to manage the reserve
  authority: string;
  // Mint address for the reserve
  mint: string;
  payer: string;
  // Reserve status (optional - null means no change)
  status: ReserveStatus | null;
  // Rate limit slope (optional - null means no change)
  rateLimitSlope: bigint | null;
  // Rate limit max outflow (optional - null means no change)
  rateLimitMaxOutflow: bigint | null;
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerManageReserve> = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      mint: "", // TODO: update to actual USDG mint
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: ReserveStatus.Active,
      rateLimitSlope: null, // null means no change
      rateLimitMaxOutflow: null, // null means no change
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      mint: "", // TODO: update to actual PYUSD mint
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: ReserveStatus.Active,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      mint: "", // TODO: update to actual CASH mint
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: ReserveStatus.Active,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
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
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      mint: PYUSD_MINT,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: ReserveStatus.Active,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      mint: CASH_MINT,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: ReserveStatus.Active,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
    },
  },
};

