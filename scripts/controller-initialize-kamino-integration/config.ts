import {
  IntegrationStatus,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  NetworkStablecoinConfig,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
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
import { KEEL_SUB_PROXY_CPI_AUTHORITY } from "../../src";
import { kamino } from "@keel-fi/svm-alm-controller";

export const ACTION = "controller-initialize-kamino-integration";

type ControllerInitializeKaminoIntegration = {
  controllerProgramId: string;
  // Controller that the Integration applies to
  controller: string;
  // Authority that has permission to initialize the integration
  authority: string;
  payer: string;
  // Integration status
  status: IntegrationStatus;
  // Description of the integration
  description: string;
  // Rate limit slope
  rateLimitSlope: bigint;
  // Rate limit max outflow
  rateLimitMaxOutflow: bigint;
  // Permit liquidation
  permitLiquidation: boolean;
  // Kamino specific args
  obligationId: number;
  market: string;
  reserve: string;
  reserveLiquidityMint: string;
  referrer: string;
  reserveFarmCollateral: string;
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerInitializeKaminoIntegration> =
  {
    devnet: {
      USDG: {
        controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
        controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
        authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
        payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
        status: IntegrationStatus.Active,
        description: "Kamino Main USDG",
        rateLimitSlope: 10_000_000_000_000n,
        rateLimitMaxOutflow: 25_000_000_000_000n,
        permitLiquidation: true,
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
        description: "Kamino Main PYUSD",
        rateLimitSlope: 10_000_000_000_000n,
        rateLimitMaxOutflow: 25_000_000_000_000n,
        permitLiquidation: true,
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
        description: "Kamino Main CASH",
        rateLimitSlope: 10_000_000_000_000n,
        rateLimitMaxOutflow: 25_000_000_000_000n,
        permitLiquidation: true,
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
        description: "Kamino Main USDG",
        rateLimitSlope: 10_000_000_000_000n,
        rateLimitMaxOutflow: 25_000_000_000_000n,
        permitLiquidation: true,
        obligationId: 0,
        market: KAMINO_MAIN_MARKET,
        reserve: KAMINO_USDG_RESERVE, 
        reserveLiquidityMint: USDG_MINT,
        referrer: kamino.KAMINO_LEND_PROGRAM_ID,
        reserveFarmCollateral: KAMINO_USDG_FARM_COLLATERAL
      },
      PYUSD: {
        controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
        controller: SVM_ALM_CONTROLLER,
        authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
        payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
        status: IntegrationStatus.Active,
        description: "Kamino Main PYUSD",
        rateLimitSlope: 10_000_000_000_000n,
        rateLimitMaxOutflow: 25_000_000_000_000n,
        permitLiquidation: true,
        obligationId: 0,
        market: KAMINO_MAIN_MARKET,
        reserve: KAMINO_PYUSD_RESERVE,
        reserveLiquidityMint: PYUSD_MINT,
        referrer: kamino.KAMINO_LEND_PROGRAM_ID,
        reserveFarmCollateral: KAMINO_PYUSD_FARM_COLLATERAL
      },
      CASH: {
        controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
        controller: SVM_ALM_CONTROLLER,
        authority: KEEL_SUB_PROXY_CPI_AUTHORITY,
        payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
        status: IntegrationStatus.Active,
        description: "Kamino Main CASH",
        rateLimitSlope: 10_000_000_000_000n,
        rateLimitMaxOutflow: 25_000_000_000_000n,
        permitLiquidation: true,
        obligationId: 0,
        market: KAMINO_MAIN_MARKET,
        reserve: KAMINO_CASH_RESERVE, 
        reserveLiquidityMint: CASH_MINT,
        referrer: kamino.KAMINO_LEND_PROGRAM_ID,
        reserveFarmCollateral: KAMINO_CASH_FARM_COLLATERAL,
      },
    },
  };
