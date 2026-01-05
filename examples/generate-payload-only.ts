/**
 * Simple Payload Generation Example
 * 
 * This example demonstrates generating a cross-chain payload without
 * running the full simulation. This is useful for quick testing and
 * integration with Ethereum contracts.
 * 
 * Run with: ts-node examples/generate-payload-only.ts
 */

import { web3 } from "@coral-xyz/anchor";
import {
  generateCrossChainPayload,
  CrossChainConfig,
  LayerZeroConfig,
  EthereumAddresses,
  ethereumAddressToBytes32,
  SKY_LZ_GOVERNANCE_ACCOUNT,
} from "../src";

async function main() {
  console.log("📦 Cross-Chain Payload Generation");
  console.log("==================================\n");
  
  // Step 1: Create memo instruction
  const memoMessage = "Hello from Ethereum via LayerZero!";
  const memoInstruction = new web3.TransactionInstruction({
    programId: LayerZeroConfig.MEMO_PROGRAM,
    keys: [],
    data: Buffer.from(memoMessage),
  });
  
  console.log("📝 Instruction:");
  console.log(`   Program: ${memoInstruction.programId.toString()}`);
  console.log(`   Message: "${memoMessage}"`);
  console.log(`   Data: ${memoInstruction.data.length} bytes\n`);
  
  // Step 2: Configure cross-chain parameters
  const senderBytes = ethereumAddressToBytes32(EthereumAddresses.GOVERNANCE_OAPP_SENDER);
  const config: CrossChainConfig = {
    srcEid: LayerZeroConfig.ETHEREUM_ENDPOINT_ID,
    dstEid: LayerZeroConfig.SOLANA_ENDPOINT_ID,
    sender: senderBytes,
    receiver: new web3.PublicKey(SKY_LZ_GOVERNANCE_ACCOUNT),
    nonce: 1n,
    originCaller: ethereumAddressToBytes32(EthereumAddresses.L1_GOVERNANCE_RELAY),
  };
  
  // Step 3: Generate payload
  console.log("🔧 Generating cross-chain payload...\n");
  const payload = generateCrossChainPayload(memoInstruction, config);
  
  // Step 4: Display results
  console.log("📊 PAYLOAD GENERATED");
  console.log("====================");
  console.log(`📦 Serialized instruction: ${payload.serializedInstruction.length} bytes`);
  console.log(`   Hex: 0x${payload.serializedInstruction.toString("hex")}`);
  console.log(`\n🔗 Complete message: ${payload.message.length} bytes`);
  console.log(`   Hex: 0x${payload.message.toString("hex")}`);
  console.log(`\n🆔 GUID: 0x${payload.guid.toString("hex")}`);
  console.log(`\n🔐 Payload hash: 0x${payload.payloadHash.toString("hex")}`);
  
  console.log("\n💡 Use the serialized instruction with Ethereum GovernanceOAppSender contract!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

