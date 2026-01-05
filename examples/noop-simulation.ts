/**
 * Generic Cross-Chain Noop Simulation
 * 
 * This example demonstrates the complete generic cross-chain simulation
 * using the noop program for simple no-operation governance actions:
 * 1. Generate cross-chain payload from noop instruction
 * 2. Set up LiteSVM with real governance programs
 * 3. Dynamically load all required accounts from mainnet  
 * 4. Spoof LayerZero accounts (payload_hash, nonce, etc)
 * 5. Execute complete lz_receive instruction flow
 * 6. Show actual execution logs from noop program
 * 
 * Run with: ts-node examples/noop-simulation.ts
 */

import { web3 } from "@coral-xyz/anchor";
import {
  simulateCompleteCrossChainInstruction,
  CrossChainConfig,
  LayerZeroConfig,
  EthereumAddresses,
  ethereumAddressToBytes32,
  SKY_LZ_GOVERNANCE_ACCOUNT,
} from "../src";

async function main() {
  console.log("🚀 Generic Cross-Chain Noop Simulation");
  console.log("======================================\n");
  
  // Step 1: Create noop instruction
  const noopInstruction = new web3.TransactionInstruction({
    programId: LayerZeroConfig.NOOP_PROGRAM,
    keys: [], // Noop program requires no accounts
    data: Buffer.alloc(0), // Noop program requires no data
  });
  
  console.log("⚡ Creating noop instruction");
  console.log(`   Program: ${noopInstruction.programId.toString()}`);
  console.log("   Purpose: No-operation governance action");
  console.log(`   Data: ${noopInstruction.data.length} bytes`);
  console.log(`   Accounts: ${noopInstruction.keys.length} accounts\n`);
  
  // Step 2: Configure cross-chain parameters
  const senderBytes = ethereumAddressToBytes32(EthereumAddresses.GOVERNANCE_OAPP_SENDER);
  const config: CrossChainConfig = {
    srcEid: LayerZeroConfig.ETHEREUM_ENDPOINT_ID,
    dstEid: LayerZeroConfig.SOLANA_ENDPOINT_ID,
    sender: senderBytes,
    receiver: new web3.PublicKey(SKY_LZ_GOVERNANCE_ACCOUNT),
    nonce: 2n, // Using different nonce than memo example
    originCaller: ethereumAddressToBytes32(EthereumAddresses.L1_GOVERNANCE_RELAY),
  };
  
  // Step 3: Run complete simulation using generic function
  console.log("🔥 Running complete cross-chain simulation...\n");
  
  const result = await simulateCompleteCrossChainInstruction(noopInstruction, config);
  
  // Step 4: Display clean results
  console.log("\n📊 SIMULATION COMPLETE");
  console.log("======================");
  console.log(`📦 Serialized payload: ${result.serializedPayload.length} bytes`);
  console.log(`🔗 Ethereum payload: 0x${result.serializedPayload.toString("hex")}`);
  
  if (result.success) {
    console.log("✅ Execution: SUCCESS");
    console.log("\n📜 Execution logs:");
    result.executionLogs.forEach((log, i) => {
      console.log(`  [${i + 1}] ${log}`);
    });
  } else {
    console.log("⚠️  Execution: SIMULATED");
  }
  
  console.log("\n💡 Ready for Ethereum GovernanceOAppSender integration!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

