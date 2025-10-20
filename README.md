# Sky Solana Crosschain Governance Payload Scripts

This repository contains scripts for the construction of TransactionInstructions and converting them into a crosschain governance payload for a respective spell.

## Structure

Each spell has its own directory under `scripts/`, containing:

- **`generate-payload.ts`** → Builds the governance payload for the spell, writing it to `/output.json`.
- **`validate.ts`** → Verifies the generated payload against the expected format.

Current spell directories:

- `scripts/wh-program-upgrade/`
- `scripts/ntt-transfer-mint-authority/`

## Installation

Before running the scripts, download depdencies with:

```
yarn install
```

## Usage

|         | Type      | Description                                                     |
| ------- | --------- | --------------------------------------------------------------- |
| NETWORK | env       | Sets config values                                              |
| --file  | parameter | OPTIONAL Prefix of file name, will be appended with the network |

To generate and validate a payload for a spell:

1. **Generate the payload**

   ```bash
   NETWORK=[devnet|mainnet] ts-node ./scripts/controller-manage-permission/generate-payload.ts --file manage-permissions.txt
   ```

2. **Validate the payload**
   ```bash
   NETWORK=[devnet|mainnet] ts-node ./scripts/controller-manage-permission/validate.ts --file manage-permissions.txt
   ```

Swap `controller-manage-permission` for other spells, e.g.:

```bash
NETWORK=devnet ts-node ./scripts/wh-program-upgrade/generate-payload.ts --file program-upgrade.txt
NETWORK=devnet ts-node ./scripts/wh-program-upgrade/validate.ts --file program-upgrade.txt
```

## @solana/web3.js vs @solana/kit

This tool is currently using both of the main Solana TS SDKs. The reasoning for this is that some programs use anchor (i.e. WH's NTT program) and therefore it's easier to interact with the program using Anchor's SDK which uses @solana/web3.js. However, other programs like the SVM ALM Controller using Codama generated SDKs use the newer @solana/kit. This should have no impact on the Scripts in this repository, but it's worth noting that script authors should use whichever SDK makes it easiest to interact with the program(s) they're building for.

## Generated SDKs

The tool uses Codama to generate SDKs for some protocols such as the Metaplex Token Metadata program. For verification, others may regenerate these generated SDKs using `yarn generate-clients`.

NOTE: we currently leave all generated files in for completeness, but would be open to trimming down the generated files if requested.
