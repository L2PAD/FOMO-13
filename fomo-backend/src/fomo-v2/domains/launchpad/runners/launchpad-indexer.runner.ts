import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import { FomoV2LaunchpadSyncService } from "../services";

export async function main(): Promise<void> {
  process.env.FOMO_V2_LAUNCHPAD_INDEXER_ENABLED = "true";
  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn", "log"],
  });
  // Resolve the provider explicitly; its onModuleInit hook starts the guarded
  // scanner loop after the application context is ready.
  app.get(FomoV2LaunchpadSyncService);

  let closing = false;
  let resolveStopped!: () => void;
  const stopped = new Promise<void>((resolve) => {
    resolveStopped = resolve;
  });
  const close = async () => {
    if (closing) return;
    closing = true;
    try {
      await app.close();
      process.exitCode = 0;
    } catch (error: any) {
      console.error(
        `[fomo-v2:launchpad-indexer] graceful shutdown failed: ${
          error?.stack || error
        }`
      );
      process.exitCode = 1;
    } finally {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
      resolveStopped();
    }
  };
  const onSignal = () => void close();
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  // The service owns its interval. Keep this dedicated worker alive until a
  // process signal invokes the graceful close handler above.
  await stopped;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:launchpad-indexer] ${error?.stack || error}`);
    process.exitCode = 1;
  });
}
