import { NestFactory } from "@nestjs/core";
import { FomoV2ParserImportRuntimeService } from "../services/parser-import-runtime.service";
import {
  assertParserImportSafety,
  parseStrictBoolean,
} from "./parser-import-runner.utils";

export type ParserImportFailureRecoveryArgs = {
  action: "list" | "requeue";
  pipeline: string;
  sourceType: string;
  sourceDatabase: string;
  sourceCollection: string;
  sourceDocumentId?: string;
  status?: "retrying" | "quarantined" | "resolved";
  limit: number;
  write: boolean;
  confirmWrite: boolean;
};

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  assertRecoverySafety(args);
  // Keep argument/safety tooling independent from bootstrapping the full CLI
  // graph so operators can validate a command before any DB providers load.
  const { FomoV2CliModule } = require("../fomo-v2-cli.module");
  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });
  try {
    const runtime = app.get(FomoV2ParserImportRuntimeService);
    const identity = {
      pipeline: args.pipeline,
      sourceType: args.sourceType,
      sourceDatabase: args.sourceDatabase,
      sourceCollection: args.sourceCollection,
    };
    const result =
      args.action === "requeue"
        ? await runtime.requeueDocumentFailure({
            ...identity,
            sourceDocumentId: args.sourceDocumentId!,
          })
        : await runtime.listDocumentFailures({
            ...identity,
            sourceDocumentId: args.sourceDocumentId,
            status: args.status,
            limit: args.limit,
          });
    console.log(
      JSON.stringify(
        {
          action: args.action,
          dryRun: args.action === "list",
          identity,
          sourceDocumentId: args.sourceDocumentId,
          result,
        },
        null,
        2
      )
    );
  } finally {
    await app.close();
  }
}

export function parseArgs(argv: string[]): ParserImportFailureRecoveryArgs {
  const args: ParserImportFailureRecoveryArgs = {
    action: "list",
    pipeline: "",
    sourceType: "",
    sourceDatabase: "",
    sourceCollection: "",
    limit: 50,
    write: false,
    confirmWrite: false,
  };
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();
    if (key === "action") {
      if (!["list", "requeue"].includes(value.toLowerCase())) {
        throw new Error("--action must be list or requeue.");
      }
      args.action = value.toLowerCase() as "list" | "requeue";
    } else if (key === "pipeline") args.pipeline = value;
    else if (key === "source") args.sourceType = value;
    else if (key === "database") args.sourceDatabase = value;
    else if (key === "collection") args.sourceCollection = value;
    else if (key === "document-id") args.sourceDocumentId = value;
    else if (key === "status") {
      if (
        !["retrying", "quarantined", "resolved"].includes(value.toLowerCase())
      ) {
        throw new Error("--status must be retrying, quarantined, or resolved.");
      }
      args.status =
        value.toLowerCase() as ParserImportFailureRecoveryArgs["status"];
    } else if (key === "limit") args.limit = Number(value);
    else if (key === "write") args.write = parseStrictBoolean(value, "write");
    else if (key === "confirm-write") {
      args.confirmWrite = parseStrictBoolean(value, "confirm-write");
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }
  return args;
}

export function assertRecoverySafety(
  args: ParserImportFailureRecoveryArgs
): void {
  for (const [name, value] of [
    ["pipeline", args.pipeline],
    ["source", args.sourceType],
    ["database", args.sourceDatabase],
    ["collection", args.sourceCollection],
  ]) {
    if (!String(value || "").trim()) throw new Error(`--${name} is required.`);
  }
  if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
    throw new Error("--limit must be an integer between 1 and 100.");
  }
  if (args.action === "list") {
    if (args.write || args.confirmWrite) {
      throw new Error("List mode is read-only; omit --write/--confirm-write.");
    }
    return;
  }
  if (!args.sourceDocumentId) {
    throw new Error("Requeue requires exact --document-id.");
  }
  if (!args.write) {
    throw new Error("Requeue requires --write=true.");
  }
  assertParserImportSafety({
    label: "Parser import failure recovery",
    write: args.write,
    confirmWrite: args.confirmWrite,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[parser-import-failure-recovery] ${error?.message || error}`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
