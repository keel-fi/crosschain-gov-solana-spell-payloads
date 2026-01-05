# Cross-Chain Governance Simulation Examples

This directory contains examples demonstrating how to use the cross-chain governance simulation toolkit.

## Examples

### 1. `generate-payload-only.ts`

Simple example that generates a cross-chain payload without running the full simulation. This is the fastest way to test payload generation.

**Usage:**
```bash
ts-node examples/generate-payload-only.ts
```

**What it does:**
- Creates a memo instruction
- Generates the cross-chain payload (GUID, payload hash, serialized instruction)
- Displays the payload in hex format ready for Ethereum contract integration

### 2. `memo-simulation.ts`

Complete cross-chain simulation using the Solana memo program. This demonstrates the full simulation flow including account loading and spoofing.

**Usage:**
```bash
ts-node examples/memo-simulation.ts
```

**What it does:**
- Creates a memo instruction with a text message
- Runs complete simulation with LiteSVM
- Loads accounts from mainnet
- Spoofs LayerZero accounts (payload hash, nonce, etc.)
- Displays execution logs

**Note:** This example requires network access to load accounts from Solana mainnet. Set `SOLANA_RPC_URL` environment variable for custom RPC endpoint.

### 3. `noop-simulation.ts`

Complete cross-chain simulation using the noop program. Similar to memo-simulation but uses a no-operation instruction.

**Usage:**
```bash
ts-node examples/noop-simulation.ts
```

**What it does:**
- Creates a noop instruction
- Runs complete simulation with LiteSVM
- Loads accounts from mainnet
- Spoofs LayerZero accounts
- Displays execution logs

## Environment Variables

You can customize the RPC endpoint used for account loading:

```bash
# Option 1: Use SOLANA_RPC_URL
export SOLANA_RPC_URL=https://your-rpc-endpoint.com
ts-node examples/memo-simulation.ts

# Option 2: Use SOLANA_RPC_ENDPOINT (alternative name)
export SOLANA_RPC_ENDPOINT=https://your-rpc-endpoint.com
ts-node examples/memo-simulation.ts
```

If no environment variable is set, the examples will use the public Solana RPC endpoint.

## Expected Output

### generate-payload-only.ts
```
📦 Cross-Chain Payload Generation
==================================

📝 Instruction:
   Program: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
   Message: "Hello from Ethereum via LayerZero!"
   Data: 32 bytes

🔧 Generating cross-chain payload...

📊 PAYLOAD GENERATED
====================
📦 Serialized instruction: 34 bytes
   Hex: 0x0000...
...
```

### memo-simulation.ts / noop-simulation.ts
```
🚀 Generic Cross-Chain Memo Simulation
======================================

📝 Creating memo instruction
   Program: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
   Message: "Cross-chain governance memo from Ethereum via LayerZero!"
   Data: 56 bytes

🔥 Running complete cross-chain simulation...

🚀 Starting complete cross-chain simulation...
...
📊 SIMULATION COMPLETE
======================
📦 Serialized payload: 34 bytes
🔗 Ethereum payload: 0x...
✅ Execution: SUCCESS

📜 Execution logs:
  [1] Program SKYGRikJcGSa3jC5HDyzDrVsmkCk3e5SqAurycny8PW invoke [1]
  ...
```

## Integration

The generated payloads can be used with:

1. **Ethereum GovernanceOAppSender contract** - Use the `serializedInstruction` field
2. **Full simulation** - Use `simulateCompleteCrossChainInstruction()` for testing
3. **Payload validation** - Use validation functions from `xchain-gov-payload.ts`

## Customization

You can customize the examples by:

- Changing the instruction (program, accounts, data)
- Adjusting the cross-chain config (nonce, sender, receiver)
- Modifying the simulation parameters
- Adding custom account loading logic

See the source code for each example for details.

