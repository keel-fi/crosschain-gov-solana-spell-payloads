import {
  IntegrationStatus,
  IntegrationType,
  SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
} from "@keel-fi/svm-alm-controller";
import {
  Network,
  Stablecoin,
  NetworkStablecoinConfig,
  SVM_ALM_CONTROLLER,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
} from "../../src";

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
  obligation: string;
};

export const NETWORK_CONFIGS: NetworkStablecoinConfig<ControllerInitializeKaminoIntegration> = {
  devnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Kamino Integration for USDG",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      obligation: "", // TODO: update to actual obligation address
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Kamino Integration for PYUSD",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      obligation: "", // TODO: update to actual obligation address
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ADDRESS,
      controller: "4N4QPLwUviKAXniw6N8CuNwZAp9pHbGdjZtzyoYMHUz6",
      authority: "PcJcgdWmFZznhhfN28i6T8GHcwA6jmFGuUeNNGvcSY2",
      payer: "3ZEoogXb7fmYQFwtmm9cNFdgNepxeWE1S7YutTFVYoxr",
      status: IntegrationStatus.Active,
      description: "Kamino Integration for CASH",
      rateLimitSlope: 0n,
      rateLimitMaxOutflow: 0n,
      permitLiquidation: false,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      obligation: "", // TODO: update to actual obligation address
    },
  },
  mainnet: {
    USDG: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      // TODO: update to actual authority
      authority: "",
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Kamino Integration for USDG",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      obligation: "", // TODO: update to actual obligation address
    },
    PYUSD: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      // TODO: update to actual authority
      authority: "",
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Kamino Integration for PYUSD",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      obligation: "", // TODO: update to actual obligation address
    },
    CASH: {
      controllerProgramId: SVM_ALM_CONTROLLER_PROGRAM_ID,
      controller: SVM_ALM_CONTROLLER,
      // TODO: update to actual authority
      authority: "",
      payer: "8acMLGppEZ3RijkBUsd4L6bHomRFCjdctU7KydNihnVe",
      status: IntegrationStatus.Active,
      description: "Kamino Integration for CASH",
      rateLimitSlope: 0n, // TODO: update to actual rate limit slope
      rateLimitMaxOutflow: 0n, // TODO: update to actual rate limit max outflow
      permitLiquidation: false,
      obligationId: 0, // TODO: update to actual obligation ID
      market: "", // TODO: update to actual market address
      reserve: "", // TODO: update to actual reserve address
      reserveLiquidityMint: "", // TODO: update to actual reserve liquidity mint
      obligation: "", // TODO: update to actual obligation address
    },
  },
};

