# Sky Solana Crosschain Governance Payload Scripts

This repository contains scripts for the construction of TransactionInstructions and converting them into a crosschain governance payload for a respective spell.

## Structure

Each spell has its own directory under `scripts/`, containing:

- **`generate-payload.ts`** → Builds the governance payload for the spell, writing it to a file (default: `{action}-{network}.txt` or `{action}-{stablecoin}-{network}.txt`).
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

### Environment Variables

| Variable  | Type | Description                                                          |
| --------- | ---- | -------------------------------------------------------------------- |
| NETWORK   | env  | Required. Sets the network: `devnet`, `mainnet`, or `surfpool`      |
| STABLECOIN| env  | Optional. Sets the stablecoin type: `USDG`, `PYUSD`, or `CASH`      |

### Command Line Arguments

| Argument      | Type   | Description                                                                                    |
| ------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `--file` / `-f` | string | Optional. Output file name prefix. Defaults to `{action}-{network}.txt` or `{action}-{stablecoin}-{network}.txt` if STABLECOIN is set |
| `--config` / `-c` | string | Required for some scripts. Path to a TypeScript config file (e.g., `configs/CASH-mainnet.ts`) |
| `--packet-bytes` / `-b` | string | Optional (validate only). Hex string of LayerZero Packet bytes to decode and validate         |
| `--bytes`     | string | Optional (validate only). Alternative to `--packet-bytes`. Can be `@/path/to/file` to read from file |

### Basic Workflow

1. **Generate the payload**

   ```bash
   NETWORK=devnet ts-node ./scripts/controller-manage-permission/generate-payload.ts --file manage-permissions.txt
   ```

2. **Validate the payload**
   ```bash
   NETWORK=devnet ts-node ./scripts/controller-manage-permission/validate.ts --file manage-permissions.txt
   ```

### Examples

**Using default file names:**
```bash
NETWORK=devnet ts-node ./scripts/wh-program-upgrade/generate-payload.ts
NETWORK=devnet ts-node ./scripts/wh-program-upgrade/validate.ts
```

**Using config files (for scripts that require them):**
```bash
NETWORK=mainnet ts-node ./scripts/controller-manage-atomic-swap-integration/generate-payload.ts --config configs/CASH-mainnet.ts
NETWORK=mainnet ts-node ./scripts/controller-manage-atomic-swap-integration/validate.ts --config configs/CASH-mainnet.ts
```

**Validating from LayerZero Packet bytes:**
```bash
NETWORK=mainnet ts-node ./scripts/controller-manage-permission/validate.ts --bytes 010000...
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

Some of the tests must run on localhost (surfpool) so that the SVM Controller can be upgraded to a planned version. The upgraded controller enables PYUSD and USDG to be used in the controller: https://github.com/keel-fi/svm-alm-controller/pull/158

To test with surfpool, you need to run the following commands to set the program upgrade authority and deploy the new controller:

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