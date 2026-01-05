/**
 * Layer Zero Controller Instruction Simulation Example
 * 
 * This example demonstrates how to simulate SVM ALM Controller instructions
 * through Layer Zero governance and validate the results.
 * 
 * Run with: ts-node examples/lz-controller-simulation.ts
 */

import { web3 } from "@coral-xyz/anchor";
import {
  simulateControllerPayloadWithLayerZero,
  simulateControllerInstructionWithLayerZero,
  createLzControllerSimulationConfig,
  readPayloadFile,
  KEEL_SUB_PROXY_CPI_AUTHORITY,
  SVM_ALM_CONTROLLER_PROGRAM_ID,
  MAINNET_PAYER,
} from "../src";

async function main() {
  console.log("🚀 Layer Zero Controller Instruction Simulation");
  console.log("==============================================\n");
  
  // Example 1: Simulate from a payload file
  console.log("📦 Example 1: Simulating from payload file");
  console.log("-------------------------------------------\n");
  
  // This would typically come from a generated payload file
  // For demonstration, we'll show the pattern:
  /*
  const payload = readPayloadFile("controller-initialize-reserve-CASH-mainnet.txt");
  const config = createLzControllerSimulationConfig(
    new web3.PublicKey(MAINNET_PAYER),
    new web3.PublicKey(KEEL_SUB_PROXY_CPI_AUTHORITY),
    1n // nonce
  );
  
  const result = await simulateControllerPayloadWithLayerZero(
    payload,
    new web3.PublicKey(SVM_ALM_CONTROLLER_PROGRAM_ID),
    config
  );
  
  if (result.success) {
    console.log("✅ Simulation successful!");
    console.log(`   Accounts modified: ${Object.keys(result.accountStates).length}`);
    
    // Validate account changes
    for (const [address, states] of Object.entries(result.accountStates)) {
      if (states.before && states.after) {
        const changed = !states.before.data.equals(states.after.data) ||
                       states.before.lamports !== states.after.lamports;
        if (changed) {
          console.log(`   📝 ${address}: changed`);
        }
      } else if (states.after && !states.before) {
        console.log(`   ✨ ${address}: created`);
      }
    }
  } else {
    console.error("❌ Simulation failed:", result.error);
  }
  */
  
  console.log("💡 To use this example:");
  console.log("   1. Generate a payload using a script in scripts/");
  console.log("   2. Read the payload file");
  console.log("   3. Create simulation config");
  console.log("   4. Call simulateControllerPayloadWithLayerZero()");
  console.log("   5. Validate the account states\n");
  
  // Example 2: Simulate from an instruction directly
  console.log("📝 Example 2: Simulating from instruction");
  console.log("-------------------------------------------\n");
  
  console.log("💡 To simulate an instruction directly:");
  console.log("   1. Create your controller instruction");
  console.log("   2. Create simulation config");
  console.log("   3. Call simulateControllerInstructionWithLayerZero()");
  console.log("   4. Validate the account states\n");
  
  console.log("📚 Available functions:");
  console.log("   - simulateControllerPayloadWithLayerZero() - Simulate from payload file");
  console.log("   - simulateControllerInstructionWithLayerZero() - Simulate from instruction");
  console.log("   - createLzControllerSimulationConfig() - Helper to create config\n");
  
  console.log("✅ Example complete!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

