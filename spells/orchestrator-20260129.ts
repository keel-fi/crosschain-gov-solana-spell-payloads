import "dotenv/config";
import { spawnSync } from "node:child_process";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

function isHex0x(v: unknown): v is string {
  return typeof v === "string" && /^0x[0-9a-fA-F]+$/.test(v);
}

function getEncodedPayloadFromInputs(log: any): string | undefined {
  const inputs = log?.inputs;
  if (!Array.isArray(inputs)) return undefined;

  const v = inputs.find((i: any) => i?.soltype?.name === "encodedPayload")?.value;
  return isHex0x(v) ? v : undefined;
}

async function fetchEncodedPayloads(simulationId: string): Promise<string[]> {

  const accessKey = process.env.TENDERLY_ACCESS_KEY;

  if (!accessKey) throw new Error("Missing env TENDERLY_ACCESS_KEY");

  const url = `https://api.tenderly.co/api/v1/account/matarikilabs/project/project/simulations/${simulationId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Access-Key": accessKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Tenderly error ${res.status}`);

  const json = await res.json();

  const logs = json?.transaction?.transaction_info?.call_trace?.logs;
  if (!Array.isArray(logs)) return [];

  const payloads: string[] = [];
  for (const log of logs) {
    if (log?.name !== "PacketSent") continue;
    const p = getEncodedPayloadFromInputs(log);
    if (p) payloads.push(p);
  }

  return payloads;
}

async function main() {
  const simulationId = arg("--simulation-id") ?? arg("--sim");
  if (!simulationId) {
    throw new Error("Missing --simulation-id");
  }

  const packets = await fetchEncodedPayloads(simulationId);

  if (packets.length === 0) {
    throw new Error(`No PacketSent encodedPayload found for simulation ${simulationId}`);
  }

  const validations = [
    "./scripts/controller-manage-permission/validate.ts"
  ];

  const packet = packets[0];

  for (const script of validations) {
    const res = spawnSync("npx", ["ts-node", script, "--packet-bytes", packet], {
        stdio: "inherit",
        env: process.env,
    });

    if (res.status !== 0) process.exit(res.status ?? 1);
    console.log(`OK ${script}`);
  }

  console.log("OK spell validated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
