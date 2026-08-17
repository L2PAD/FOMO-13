import "dotenv/config";
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import * as path from "path";
import {
  IMAGE_MIRROR_ALLOWLIST,
  MARKET_PROJECT_LOGO_SOURCE,
  findMirrorSource,
  sourceKey,
} from "../image-inventory.config";
import {
  parseBoolean,
  parseNonNegativeInteger,
  parsePositiveInteger,
} from "../image-inventory.utils";

type WorkerMode = "dry-run" | "write";

interface WorkerArgs {
  mode: WorkerMode;
  limitPerSource: number;
  concurrency: number;
  timeoutMs: number;
  retries: number;
  retryFailed: boolean;
  failedRetryAfterHours: number;
  examplesLimit: number;
  logDir?: string;
  stopOnError: boolean;
  stopOnFailedCounters: boolean;
  skipMarket: boolean;
  sources: string[];
}

interface MirrorReport {
  mode: "dry-run" | "write";
  source: string;
  scannedDocs: number;
  processedCandidates: number;
  foundUrls: number;
  skippedAlreadyR2: number;
  skippedEmpty: number;
  skippedInvalid: number;
  skippedUnsupportedMime: number;
  wouldDownload: number;
  downloaded: number;
  uploaded: number;
  reusedExistingMapping: number;
  skippedFailedMapping: number;
  retriedFailed: number;
  failedRetrySucceeded: number;
  failedRetryStillFailed: number;
  failedDownload: number;
  failedUpload: number;
  dbWouldUpdate: number;
  dbUpdated: number;
}

interface SourceRunSummary {
  source: string;
  status: "ok" | "failed";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number | null;
  logPath: string;
  report?: MirrorReport;
  error?: string;
}

interface WorkerSummary {
  mode: WorkerMode;
  limitPerSource: number;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: "running" | "ok" | "failed";
  logDir: string;
  sources: string[];
  totals: Record<string, number>;
  runs: SourceRunSummary[];
}

const NUMERIC_REPORT_KEYS: Array<keyof MirrorReport> = [
  "scannedDocs",
  "processedCandidates",
  "foundUrls",
  "skippedAlreadyR2",
  "skippedEmpty",
  "skippedInvalid",
  "skippedUnsupportedMime",
  "wouldDownload",
  "downloaded",
  "uploaded",
  "reusedExistingMapping",
  "skippedFailedMapping",
  "retriedFailed",
  "failedRetrySucceeded",
  "failedRetryStillFailed",
  "failedDownload",
  "failedUpload",
  "dbWouldUpdate",
  "dbUpdated",
];

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.mode === "write" && process.env.STORAGE_DRIVER !== "r2") {
    throw new Error("Write worker requires STORAGE_DRIVER=r2.");
  }

  const sources = selectSources(args);
  const startedAt = new Date();
  const logDir = path.resolve(
    args.logDir || path.join("logs", `r2-active-mirror-${formatTimestamp(startedAt)}`),
  );
  await mkdir(logDir, { recursive: true });

  const summary: WorkerSummary = {
    mode: args.mode,
    limitPerSource: args.limitPerSource,
    startedAt: startedAt.toISOString(),
    status: "running",
    logDir,
    sources,
    totals: createEmptyTotals(),
    runs: [],
  };

  log(`starting mode=${args.mode} sources=${sources.length} limitPerSource=${args.limitPerSource}`);
  log(`logDir=${logDir}`);
  await writeSummary(logDir, summary);

  for (const source of sources) {
    const run = await runSource(source, args, logDir);
    summary.runs.push(run);
    summary.totals = aggregateTotals(summary.runs);
    await writeSummary(logDir, summary);

    if (run.status === "failed" && args.stopOnError) {
      summary.status = "failed";
      break;
    }

    if (run.report && hasFailedCounters(run.report) && args.stopOnFailedCounters) {
      summary.status = "failed";
      run.status = "failed";
      run.error = "Stopped after failed counters in source report.";
      await writeSummary(logDir, summary);
      break;
    }
  }

  const finishedAt = new Date();
  summary.finishedAt = finishedAt.toISOString();
  summary.durationMs = finishedAt.getTime() - startedAt.getTime();
  if (summary.status === "running") {
    summary.status = summary.runs.every((run) => run.status === "ok") ? "ok" : "failed";
  }
  await writeSummary(logDir, summary);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.status !== "ok") {
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): WorkerArgs {
  const args: WorkerArgs = {
    mode: "dry-run",
    limitPerSource: 100_000,
    concurrency: 3,
    timeoutMs: 10_000,
    retries: 1,
    retryFailed: false,
    failedRetryAfterHours: 24,
    examplesLimit: 0,
    stopOnError: true,
    stopOnFailedCounters: true,
    skipMarket: false,
    sources: [],
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;

    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "confirm-write" || key === "confirmwrite") {
      if (parseBoolean(value, rawKey)) args.mode = "write";
    } else if (key === "dry-run" || key === "dryrun") {
      if (parseBoolean(value, rawKey)) args.mode = "dry-run";
    } else if (key === "limit-per-source" || key === "limitpersource" || key === "limit") {
      args.limitPerSource = parsePositiveInteger(value, rawKey, args.limitPerSource);
    } else if (key === "concurrency") {
      args.concurrency = parsePositiveInteger(value, rawKey, args.concurrency);
    } else if (key === "timeout-ms" || key === "timeoutms") {
      args.timeoutMs = parsePositiveInteger(value, rawKey, args.timeoutMs);
    } else if (key === "retries") {
      args.retries = parseNonNegativeInteger(value, rawKey, args.retries);
    } else if (key === "retry-failed" || key === "retryfailed") {
      args.retryFailed = parseBoolean(value, rawKey);
    } else if (key === "failed-retry-after-hours" || key === "failedretryafterhours") {
      args.failedRetryAfterHours = parseNonNegativeInteger(
        value,
        rawKey,
        args.failedRetryAfterHours,
      );
    } else if (key === "examples-limit" || key === "exampleslimit" || key === "examples") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey, args.examplesLimit);
    } else if (key === "log-dir" || key === "logdir") {
      args.logDir = value;
    } else if (key === "stop-on-error" || key === "stoponerror") {
      args.stopOnError = parseBoolean(value, rawKey);
    } else if (key === "stop-on-failed-counters" || key === "stoponfailedcounters") {
      args.stopOnFailedCounters = parseBoolean(value, rawKey);
    } else if (key === "skip-market" || key === "skipmarket") {
      args.skipMarket = parseBoolean(value, rawKey);
    } else if (key === "source") {
      args.sources.push(value);
    } else if (key === "sources") {
      args.sources.push(...value.split(",").map((source) => source.trim()).filter(Boolean));
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  args.concurrency = Math.max(1, Math.min(args.concurrency, 5));

  return args;
}

function selectSources(args: WorkerArgs): string[] {
  const sourceNames = args.sources.length
    ? args.sources
    : IMAGE_MIRROR_ALLOWLIST.map(sourceKey);
  const filtered = args.skipMarket
    ? sourceNames.filter((source) => source !== MARKET_PROJECT_LOGO_SOURCE)
    : sourceNames;

  for (const source of filtered) {
    if (!findMirrorSource(source)) {
      throw new Error(`Source "${source}" is not in image mirror allowlist.`);
    }
  }

  return filtered;
}

async function runSource(
  source: string,
  args: WorkerArgs,
  logDir: string,
): Promise<SourceRunSummary> {
  const startedAt = new Date();
  const logPath = path.join(logDir, `${sanitizeFileName(source)}.log`);
  const logStream = createWriteStream(logPath, { flags: "a" });
  const runnerCommand = buildRunnerCommand(source, args);
  const command = process.platform === "win32" && runnerCommand.command === "npx"
    ? "cmd.exe"
    : runnerCommand.command;
  const commandArgs =
    process.platform === "win32" && runnerCommand.command === "npx"
      ? ["/d", "/s", "/c", "npx.cmd", ...runnerCommand.args]
      : runnerCommand.args;
  let stdout = "";
  let stderr = "";

  log(`source start ${source}`);
  logStream.write(`=== START ${source} ${startedAt.toISOString()} ===\n`);
  logStream.write(`${command} ${commandArgs.join(" ")}\n\n`);

  const exitCode = await new Promise<number | null>((resolve) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      env: process.env,
      windowsHide: true,
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      logStream.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      logStream.write(text);
    });

    child.on("error", (error) => {
      stderr += `${error.message}\n`;
      logStream.write(`${error.message}\n`);
      resolve(1);
    });

    child.on("close", (code) => resolve(code));
  });

  const finishedAt = new Date();
  logStream.write(`\n=== END ${source} ${finishedAt.toISOString()} exitCode=${exitCode} ===\n`);
  logStream.end();

  const baseRun: SourceRunSummary = {
    source,
    status: exitCode === 0 ? "ok" : "failed",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    exitCode,
    logPath,
  };

  if (exitCode !== 0) {
    baseRun.error = extractLastError(stderr || stdout);
    log(`source failed ${source} exitCode=${exitCode}`);
    return baseRun;
  }

  try {
    baseRun.report = parseRunnerReport(stdout);
  } catch (error: any) {
    baseRun.status = "failed";
    baseRun.error = `Could not parse source report JSON: ${error?.message || error}`;
    log(`source failed ${source} report_parse_error`);
    return baseRun;
  }

  log(
    `source done ${source} processed=${baseRun.report.processedCandidates} dbUpdated=${baseRun.report.dbUpdated} uploaded=${baseRun.report.uploaded} reused=${baseRun.report.reusedExistingMapping} failedDownload=${baseRun.report.failedDownload} failedUpload=${baseRun.report.failedUpload}`,
  );

  return baseRun;
}

function buildRunnerCommand(
  source: string,
  args: WorkerArgs,
): { command: string; args: string[] } {
  const runnerArgs = [
    `--source=${source}`,
    `--limit=${args.limitPerSource}`,
    `--concurrency=${args.concurrency}`,
    `--timeout-ms=${args.timeoutMs}`,
    `--retries=${args.retries}`,
    `--failed-retry-after-hours=${args.failedRetryAfterHours}`,
    `--examples-limit=${args.examplesLimit}`,
  ];

  if (args.retryFailed) runnerArgs.push("--retry-failed=true");
  runnerArgs.push(args.mode === "write" ? "--confirm-write=true" : "--dry-run=true");

  if (isCompiledRuntime()) {
    return {
      command: process.execPath,
      args: ["dist/storage/runners/external-assets-mirror.runner.js", ...runnerArgs],
    };
  }

  return {
    command: "npx",
    args: [
      "ts-node",
      "-r",
      "tsconfig-paths/register",
      "src/storage/runners/external-assets-mirror.runner.ts",
      ...runnerArgs,
    ],
  };
}

function isCompiledRuntime(): boolean {
  return path.extname(__filename) === ".js" && __filename.includes(`${path.sep}dist${path.sep}`);
}

function parseRunnerReport(output: string): MirrorReport {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON object not found in runner stdout.");
  }

  return JSON.parse(output.slice(start, end + 1)) as MirrorReport;
}

function hasFailedCounters(report: MirrorReport): boolean {
  return (
    report.failedDownload > 0 ||
    report.failedUpload > 0 ||
    report.failedRetryStillFailed > 0 ||
    report.skippedUnsupportedMime > 0
  );
}

function createEmptyTotals(): Record<string, number> {
  return NUMERIC_REPORT_KEYS.reduce((totals, key) => {
    totals[key] = 0;
    return totals;
  }, {} as Record<string, number>);
}

function aggregateTotals(runs: SourceRunSummary[]): Record<string, number> {
  const totals = createEmptyTotals();

  for (const run of runs) {
    if (!run.report) continue;

    for (const key of NUMERIC_REPORT_KEYS) {
      totals[key] += Number(run.report[key] || 0);
    }
  }

  return totals;
}

async function writeSummary(logDir: string, summary: WorkerSummary): Promise<void> {
  const payload = `${JSON.stringify(summary, null, 2)}\n`;
  await writeFile(path.join(logDir, "summary.json"), payload);
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function extractLastError(output: string): string {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(-5).join("\n");
}

function log(message: string): void {
  console.error(`[r2-active-mirror-worker] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[r2-active-mirror-worker] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
