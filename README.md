# Sky Solana Crosschain Governance Payload Scripts

This repository contains scripts for construction TransactionInstructions and converting them into a crosschain governance payload for a respective spell.

## Structure and Usage
Each spell instruction has a corresponding script that can be run to output the payload required for the Solana crosschain governance.

For example, run the following to produce the payload for spell0 of the migration:
```
ts-node ./scripts/migration-spell0-payload.ts
```