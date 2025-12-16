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
    rho: BigInt(1735689600),
    chi: BigInt(2),
    ssr: BigInt(3) * BigInt(1e27),
  });

  // layout:
  // accounts_length:
  // [0..2] accounts_length (value: 2u16BE)
  // accounts:
  // [2..34] data_provider_authority
  // [34] is_signer (value: 1u8)
  // [35] is_writable (value: 0u8)
  // [36..68] oracle
  // [68] is_signer (value: 0u8)
  // [69] is_writable (value: 1u8)
  // data:
  // [70] Instruction discriminator (value: 3u8)
  // [71..87] rho (u128LE)
  // [87..103] chi (u128LE)
  // [103..119] ssr (u128LE)
  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(args.file, payload);
};

printSsrOraclePayload();
