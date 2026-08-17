import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { resolve } from "path";

const backendRoot = resolve(__dirname, "../../..");
const sourceRoot = resolve(backendRoot, "src");
const legacyRoot = resolve(backendRoot, "legacy");

const archivedSourceDirectories = [
  "canonical-projects",
  "funding-round-participants",
  "investor-candidates",
  "project-candidates",
  "token-unlocks",
  "funding-rounds",
  "tools/funding-rounds",
  "tools/project-comparison",
  "graph-foundation",
];

const archivedSourceFiles = [
  "projects/projects-intel-icos-sync.service.ts",
  "projects/intel-sync/icodrops-project-intel-sync.service.ts",
  "projects/intel-sync/dropstab-project-unlocks-sync.service.ts",
  "projects/intel-sync/project-identity.util.ts",
  "projects/intel-sync/models/project-intel.model.ts",
  "projects/intel-sync/models/project-unlocks.model.ts",
  "projects/intel-sync/models/pending-project-match.model.ts",
];

const archivedWorkerJobs = [
  "projects-intel-icos",
  "project-intel-icodrops",
  "project-intel-dropstab",
  "funding-rounds-intel-fundraising",
  "token-unlocks-intel-unlocks",
];

const listTypeScriptFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory()
      ? listTypeScriptFiles(path)
      : path.endsWith(".ts")
      ? [path]
      : [];
  });

describe("legacy source boundary", () => {
  it("keeps archived backfills outside the production source tree", () => {
    for (const directory of archivedSourceDirectories) {
      expect(existsSync(resolve(sourceRoot, directory))).toBe(false);
      expect(existsSync(resolve(legacyRoot, directory))).toBe(true);
    }
    for (const file of archivedSourceFiles) {
      expect(existsSync(resolve(sourceRoot, file))).toBe(false);
      expect(existsSync(resolve(legacyRoot, file))).toBe(true);
    }
  });

  it("keeps the archive manifest and package commands consistent", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(legacyRoot, "manifest.json"), "utf8"),
    );
    const manifestPaths = manifest.units.map((unit: { path: string }) => unit.path);
    const retiredWorkerJobs = manifest.units.flatMap(
      (unit: { retiredWorkerJobs?: string[] }) => unit.retiredWorkerJobs ?? []
    );
    const packageJson = readFileSync(resolve(backendRoot, "package.json"), "utf8");

    expect(new Set(manifestPaths).size).toBe(manifestPaths.length);
    expect([...retiredWorkerJobs].sort()).toEqual([...archivedWorkerJobs].sort());
    for (const directory of archivedSourceDirectories) {
      expect(manifestPaths).toContain(directory);
      expect(packageJson).not.toContain(`src/${directory}/`);
    }
  });

  it("does not allow runtime imports from backend/legacy", () => {
    const offenders = listTypeScriptFiles(sourceRoot).filter((file) => {
      const source = readFileSync(file, "utf8");
      return /(?:from\s+|require\s*\()\s*["'][^"']*legacy(?:\/|\\)/.test(
        source,
      );
    });

    expect(offenders).toEqual([]);
  });

  it("does not expose archived sync jobs through the active worker", () => {
    const activeWorkerSources = [
      "intel-sync/intel-sync.worker.ts",
      "intel-sync/intel-sync.types.ts",
      "intel-sync/intel-sync-worker.module.ts",
    ].map((file) => readFileSync(resolve(sourceRoot, file), "utf8"));

    for (const job of archivedWorkerJobs) {
      for (const source of activeWorkerSources) {
        expect(source).not.toContain(job);
      }
    }

    expect(activeWorkerSources[2]).not.toContain("FomoV2Module");
  });
});
