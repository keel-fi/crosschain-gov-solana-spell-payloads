// Generates a payload for managing a Reserve account

import {
  convertKitInstructionToWeb3Js,
  readConfigFromFile,
  readArgs,
  convertInstructionToSolanaGovernancePayload,
  writeOutputFile,
} from "../../src";
import { address, createNoopSigner } from "@solana/kit";
import { createManageReserveInstruction } from "@keel-fi/svm-alm-controller";
import { ACTION, ControllerManageReserveConfig } from "./config";

const printControllerManageReservePayload = async () => {
  const args = readArgs(ACTION);
  if (!args.config) {
    throw new Error("Must include config file '--config [CONFIG_FILE]'");
  }
  const config = readConfigFromFile<ControllerManageReserveConfig>(args.config);

  const instruction = await createManageReserveInstruction(
    address(config.controller),
    createNoopSigner(address(config.authority)),
    address(config.mint),
    config.status,
    config.rateLimitSlope,
    config.rateLimitMaxOutflow
  );

  const payload = convertInstructionToSolanaGovernancePayload(
    convertKitInstructionToWeb3Js(instruction)
  );

  writeOutputFile(config.outputFile, payload);
};

printControllerManageReservePayload().catch((err) => {
  console.error(err);
  process.exit(1);
});
