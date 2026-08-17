import {
  assertLegacyVestingWriteEnabled,
  parseArgs,
} from "./vesting-import.runner";
import { FomoV2VestingImportService } from "../services";

describe("vesting import runner args", () => {
  it("skips unlocks by default", () => {
    const args = parseArgs([]);

    expect(args.limit).toBe(100);
    expect(args.includeUnlocks).toBe(false);
    expect(args.unlocksMode).toBe("none");
  });

  it("parses explicit unlock import mode", () => {
    const args = parseArgs([
      "--include-unlocks",
      "--unlocks-mode=next-only",
      "--limit=10",
    ]);

    expect(args.includeUnlocks).toBe(true);
    expect(args.unlocksMode).toBe("next-only");
    expect(args.limit).toBe(10);
  });

  it("parses project scoped import filters", () => {
    const args = parseArgs([
      "--source-slug=near",
      "--source-project-id=22145",
      "--limit=1",
    ]);

    expect(args.sourceSlug).toBe("near");
    expect(args.sourceProjectId).toBe("22145");
    expect(args.limit).toBe(1);
  });

  it("preserves sourceType and requires write confirmation", () => {
    expect(() =>
      parseArgs(["--source-type=dropstab", "--write", "--limit=1"])
    ).toThrow("--confirm-write=true");

    expect(
      parseArgs([
        "--source-type=dropstab",
        "--write",
        "--confirm-write=true",
        "--limit=1",
      ])
    ).toMatchObject({ sourceType: "dropstab", write: true, limit: 1 });
  });

  it("requires all-confirmed for all", () => {
    expect(() => parseArgs(["--all"])).toThrow("--all-confirmed=true");
    expect(parseArgs(["--all-confirmed=true"])).toMatchObject({
      all: false,
      allConfirmed: true,
      limit: 100,
    });
    expect(parseArgs(["--all=true", "--all-confirmed=true"])).toMatchObject({
      all: true,
      allConfirmed: true,
      limit: undefined,
    });
    expect(
      parseArgs(["--all=true", "--all-confirmed=true", "--all=false"])
    ).toMatchObject({ all: false, allConfirmed: true, limit: 100 });
  });

  it("keeps the legacy write path disabled unless explicitly enabled", () => {
    expect(() =>
      assertLegacyVestingWriteEnabled({ write: true }, {})
    ).toThrow("Legacy vesting write pipeline is disabled");
    expect(() =>
      assertLegacyVestingWriteEnabled(
        { write: true },
        { FOMO_V2_LEGACY_VESTING_WRITE_ENABLED: "true" }
      )
    ).not.toThrow();
    expect(() =>
      assertLegacyVestingWriteEnabled({ write: false }, {})
    ).not.toThrow();
  });

  it("fails fast for deprecated monthly unlock mode", async () => {
    const service = new (FomoV2VestingImportService as any)(
      ...new Array(30).fill(undefined)
    );

    await expect(
      service.run({
        includeUnlocks: true,
        unlocksMode: "monthly",
        limit: 10,
      })
    ).rejects.toThrow("monthly");
  });
});
