export * from "../domains/market/runners/coingecko-market-universe-report.runner";
import { main } from "../domains/market/runners/coingecko-market-universe-report.runner";

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:market-runner-compat] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
