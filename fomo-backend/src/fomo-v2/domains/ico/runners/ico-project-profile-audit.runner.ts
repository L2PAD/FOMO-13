import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import { IcoProjectProfileAuditService } from "../services";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(`starting sourceType=${args.sourceType}`);

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(IcoProjectProfileAuditService);
    const result = await service.run(args.sourceType);
    console.log(JSON.stringify(result, null, 2));
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): { sourceType: string } {
  const args = { sourceType: "icodrops" };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "source-type" || key === "sourcetype") {
      args.sourceType = parseNonEmptyString(value, rawKey).toLowerCase();
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
}

function parseNonEmptyString(value: string, optionName: string): string {
  const text = String(value || "").trim();
  if (!text) throw new Error(`Invalid --${optionName} value. Value must not be empty.`);
  return text;
}

function logProgress(message: string): void {
  console.error(`[fomo-v2:ico-project-profile-audit] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:ico-project-profile-audit] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
