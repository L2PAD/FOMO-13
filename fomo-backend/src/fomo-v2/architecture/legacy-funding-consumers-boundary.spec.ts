import { readFileSync } from "fs";
import { resolve } from "path";

const backendRoot = resolve(__dirname, "../../..");
const sourceRoot = resolve(backendRoot, "src");

const consumerFiles = [
  "analytics/analytics.module.ts",
  "analytics/analytics.service.ts",
  "funds/funds.module.ts",
  "funds/funds.service.ts",
  "funds/funds-analytics-snapshot.service.ts",
  "investors/investors.module.ts",
  "investors/dropstab-investors-sync.service.ts",
];

describe("legacy funding consumer boundary", () => {
  it("prevents migrated consumers from importing the legacy funding slice", () => {
    const offenders = consumerFiles.filter((file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");
      return /(?:from\s+|require\s*\()\s*["'][^"']*funding-rounds(?:\/|\\|["'])/.test(
        source
      );
    });

    expect(offenders).toEqual([]);
  });

  it("uses the lightweight v2 persistence boundary for model injection", () => {
    for (const file of [
      "analytics/analytics.module.ts",
      "funds/funds.module.ts",
      "investors/investors.module.ts",
    ]) {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");
      expect(source).toContain("FomoV2PersistenceModule");
      expect(source).toContain("src/fomo-v2/persistence");
    }
  });
});
