export * from "../domains/funding/runners/funding-feed-read-model-materialize.runner";
import { main } from "../domains/funding/runners/funding-feed-read-model-materialize.runner";

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:funding-runner-compat] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
