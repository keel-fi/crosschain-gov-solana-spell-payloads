# Tenderly Simulation Packet Validator

This script extracts **LayerZero `PacketSent` payloads** from a persisted Tenderly simulation and runs local validation scripts against each emitted packet.

It is intended to be run **after** a Tenderly simulation has completed and been saved (for example via `simulate-persistent.ts` in keel-spells repo).

---

## What this script does

- Accepts a Tenderly **simulation ID** via CLI
- Fetches the simulation details from the Tenderly REST API
- Traverses the call trace logs
- Extracts all `PacketSent` events
- Collects their `encodedPayload` values
- Runs one or more local validation scripts against each payload
- Fails immediately if any validation fails

If all packets validate successfully, the script exits cleanly.

---

## CLI usage

The script accepts either of:

- `--simulation-id <id>`

Example:

```bash
surfpool start
```


```bash
npx ts-node ./spells/orchestrator-20260129.ts --simulation-id b2dfcb59-8f34-4e50-9364-a5a28e003420
```