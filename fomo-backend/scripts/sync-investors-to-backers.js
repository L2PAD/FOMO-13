try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional in deployed environments.
}

require("ts-node/register");
require("tsconfig-paths/register");

const { main } = require("../src/fomo-v2/runners/investors-to-backers-sync.runner");

main().catch((error) => {
  console.error(`[sync:investors-to-backers] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
