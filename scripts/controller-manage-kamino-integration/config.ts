import {
  IntegrationStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  NetworkStablecoinConfig,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  CASH_MINT,
  PYUSD_MINT,
  USDG_MINT,
  KAMINO_MAIN_MARKET,
  KAMINO_CASH_RESERVE,
  KAMINO_CASH_FARM_COLLATERAL,
  KAMINO_PYUSD_RESERVE,
  KAMINO_PYUSD_FARM_COLLATERAL,
  KAMINO_USDG_RESERVE,
  KAMINO_USDG_FARM_COLLATERAL,
} from "../../src";
import { kamino } from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-manage-kamino-integration";

type ControllerManageKaminoIntegration = {
  controllerProgramId: string;
  // Controller that the Integration applies to
  controller: string;
  // Authority that has permission to manage the integration
  authority: string;
  payer: string;
  // Integration status (optional - null means no change)
  status: IntegrationStatus | null;
  // Description of the integration (optional - null means no change)
  description: string | null;
  // Rate limit slope (optional - null means no change)
  rateLimitSlope: bigint | null;
  // Rate limit max outflow (optional - null means no change)
  rateLimitMaxOutflow: bigint | null;
  // Kamino specific args (used to derive integration PDA)
  obligationId: number;
  market: string;
  reserve: string;
  reserveLiquidityMint: string;
  referrer: string;
  reserveFarmCollateral: string;
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerManageKaminoIntegration> = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: null, // null means no change
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      referrer: "", // TODO: update to actual referrer address
      reserveFarmCollateral: "", // TODO: update to actual reserve farm collateral address
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      referrer: "", // TODO: update to actual referrer address
      reserveFarmCollateral: "", // TODO: update to actual reserve farm collateral address
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      referrer: "", // TODO: update to actual referrer address
      reserveFarmCollateral: "", // TODO: update to actual reserve farm collateral address
    },
  },
  mainnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      obligationId: 0,
      market: KAMINO_MAIN_MARKET,
      reserve: KAMINO_USDG_RESERVE,
      reserveLiquidityMint: USDG_MINT,
      referrer: kamino.KAMINO_LEND_PROGRAM_ID,
      reserveFarmCollateral: KAMINO_USDG_FARM_COLLATERAL,
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      obligationId: 0,
      market: KAMINO_MAIN_MARKET,
      reserve: KAMINO_PYUSD_RESERVE,
      reserveLiquidityMint: PYUSD_MINT,
      referrer: kamino.KAMINO_LEND_PROGRAM_ID,
      reserveFarmCollateral: KAMINO_PYUSD_FARM_COLLATERAL,
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: null,
      rateLimitSlope: null,
      rateLimitMaxOutflow: null,
      obligationId: 0,
      market: KAMINO_MAIN_MARKET,
      reserve: KAMINO_CASH_RESERVE,
      reserveLiquidityMint: CASH_MINT,
      referrer: kamino.KAMINO_LEND_PROGRAM_ID,
      reserveFarmCollateral: KAMINO_CASH_FARM_COLLATERAL,
    },
  },
};

