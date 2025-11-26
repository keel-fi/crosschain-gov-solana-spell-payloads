import {
  convertKitInstructionToWeb3Js,
  readAndValidateNetworkConfig,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
  LZ_CPI_AUTHORITY_PLACEHOLDER,
} from "../../src";
import { getUpdateOracleInstruction } from "@keel-fi/ssr-oracle";
import { address, createNoopSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
import { ACTION, NETWORK_CONFIGS } from "./config";

const printSsrOraclePayload = async () => {
  const { config } = readAndValidateNetworkConfig(NETWORK_CONFIGS);
  const args = readArgs(ACTION);

  const lzDataProviderAuthoritySentinel = fromLegacyPublicKey(
    LZ_CPI_AUTHORITY_PLACEHOLDER
  );

  const instruction = getUpdateOracleInstruction({
    dataProviderAuthority: createNoopSigner(lzDataProviderAuthoritySentinel),
    oracle: address(config.oraclePda),
    rho: 1735689600,
    chi: 2,
    ssr: 3 * 1e27,
  });

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printSsrOraclePayload();
