# Sky Solana Crosschain Governance Payload Scripts

This repository contains scripts for the construction of TransactionInstructions and converting them into a crosschain governance payload for a respective spell.

## Structure

Each spell has its own directory under `scripts/`, containing:

- **`generate-payload.ts`** → Builds the governance payload for the spell, writing it to a file
- **`validate.ts`** → Verifies the generated payload by simulating the transaction and checking account state changes.

Available spell directories:

- `scripts/controller-manage-permission/`
- `scripts/controller-manage-controller/`
- `scripts/controller-manage-reserve/`
- `scripts/controller-manage-atomic-swap-integration/`
- `scripts/controller-manage-drift-integration/`
- `scripts/controller-manage-kamino-integration/`
- `scripts/controller-initialize-reserve/`
- `scripts/controller-initialize-atomic-swap-integration/`
- `scripts/controller-initialize-drift-integration/`
- `scripts/controller-initialize-kamino-integration/`
- `scripts/wh-program-upgrade/`
- `scripts/lz-program-upgrade/`
- `scripts/ntt-transfer-mint-authority/`
- `scripts/set-token-freeze-authority/`
- `scripts/update-mpl-metadata-authority/`

## Installation

Before running the scripts, install dependencies:

```bash
yarn install
```

## Usage

### Command Line Arguments

| Argument      | Type   | Description                                                                                    |
| ------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `--config` / `-c` | string | Required for scripts with multiple config files. Path to a TypeScript config file (e.g., `configs/CASH-mainnet.ts`) |
| `--bytes`     | string | Optional (validate only). Raw bytes to validate |

### Examples

**Using default file names:**
```bash
ts-node ./scripts/wh-program-upgrade/generate-payload.ts
ts-node ./scripts/wh-program-upgrade/validate.ts
```

**Using config files (for scripts that require them):**
```bash
ts-node ./scripts/controller-manage-integration/generate-payload.ts --config configs/CASH-mainnet.ts
ts-node ./scripts/controller-manage-integration/validate.ts --config configs/CASH-mainnet.ts
```

**Validating from LayerZero Packet bytes:**
```bash
ts-node ./scripts/controller-manage-permission/validate.ts --bytes 010000...
```

## Testing

Run the test suite with:

```bash
yarn test
```

This runs all test files matching `**/*.test.ts` using Mocha. Test files are located in the `src/` directory and cover:

- LayerZero packet decoding (`lz-packet-decoder.test.ts`)
- LayerZero receive types (`lz-receive-types-v2.test.ts`)
- LayerZero governance codec (`lz-governance-codec.test.ts`)
- Wormhole governance codec (`wh-governance-codec.test.ts`)

## @solana/web3.js vs @solana/kit

This tool is currently using both of the main Solana TS SDKs. The reasoning for this is that some programs use anchor (i.e. WH's NTT program) and therefore it's easier to interact with the program using Anchor's SDK which uses @solana/web3.js. However, other programs like the SVM ALM Controller using Codama generated SDKs use the newer @solana/kit. This should have no impact on the Scripts in this repository, but it's worth noting that script authors should use whichever SDK makes it easiest to interact with the program(s) they're building for.

## Generated SDKs

The tool uses Codama to generate SDKs for some protocols such as the Metaplex Token Metadata program. For verification, others may regenerate these generated SDKs using `yarn generate-clients`.

NOTE: we currently leave all generated files in for completeness, but would be open to trimming down the generated files if requested.

## Surfpool

This repository uses [Surfpool](https://docs.surfpool.run/) for local transaction simulation. Surfpool is a drop-in replacement for `solana-test-validator` that automatically fetches mainnet accounts "just in time" during simulation.

### Installation

Install Surfpool following the [official documentation](https://docs.surfpool.run/installation).

### Running Validation Scripts

1. **Start Surfpool:**
```bash
surfpool start
```

2. **Run validation scripts:**
```bash
ts-node ./scripts/controller-manage-permission/validate.ts
```

### Surfpool Cheatcodes

The simulation uses Surfpool's cheatcodes for state manipulation:

- `surfnet_setAccount` - Set custom account state (lamports, data, owner)
- `surfnet_setProgramAuthority` - Set program upgrade authority
- `surfnet_writeProgram` - Deploy program bytecode
- `surfnet_resetNetwork` - Reset network to initial state

### Upgrading Programs on Surfpool

To test with an upgraded SVM Controller, use the following commands:

```bash
surfpool start

curl -X POST http://localhost:8899 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "surfnet_setProgramAuthority",
    "params": [
      "ALM1JSnEhc5PkNecbSZotgprBuJujL5objTbwGtpTgTd", "/wallet/publicKey"
    ]
  }'

solana program deploy target/deploy/svm_alm_controller.so \
  --url http://127.0.0.1:8899 \
  --program-id ALM1JSnEhc5PkNecbSZotgprBuJujL5objTbwGtpTgTd \
  --upgrade-authority /path/to/funded/wallet (can fund using surfpool studio)
```

> **NOTE:** Simulating on surfpool causes some of the accounts to erroneously become null. Therefore when testing the upgraded controller on surfpool, we must skip these checks.