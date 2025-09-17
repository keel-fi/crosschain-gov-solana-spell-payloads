# Sky Solana Crosschain Governance Payload Scripts

This repository contains scripts for the construction of TransactionInstructions and converting them into a crosschain governance payload for a respective spell.

## Structure

Each spell has its own directory under `scripts/`, containing:
- **`generate-payload.ts`** → Builds the governance payload for the spell, writing it to `/output.json`. 
- **`validate.ts`** → Verifies the generated payload against the expected format. 

Current spell directories:
- `scripts/psm-set-rate/`
- `scripts/wh-program-upgrade/`
- `scripts/ntt-transfer-mint-authority/`

## Usage

To generate and validate a payload for a spell:

1. **Generate the payload**
   ```bash
   ts-node ./scripts/psm-set-rate/generate-payload.ts
   ```

2. **Copy the contents of `output.json` and assign them to the `PAYLOAD` variable inside the corresponding `validate.ts` script**

3. **Validate the payload**
   ```bash
   ts-node ./scripts/psm-set-rate/validate.ts
   ```

Swap `psm-set-rate` for other spells, e.g.:
```bash
ts-node ./scripts/wh-program-upgrade/generate-payload.ts
ts-node ./scripts/wh-program-upgrade/validate.ts
```
