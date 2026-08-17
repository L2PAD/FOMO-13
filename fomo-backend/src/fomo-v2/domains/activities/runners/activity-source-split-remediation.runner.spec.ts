import { parseArgs } from "./activity-source-split-remediation.runner";

describe("activity source split remediation runner", () => {
  it("defaults to a bounded dry-run", () => {
    expect(parseArgs([])).toEqual({
      write: false,
      confirmWrite: false,
      all: false,
      allConfirmed: false,
      limit: 100,
    });
  });

  it("requires explicit write confirmation", () => {
    expect(() => parseArgs(["--write"])).toThrow("explicit --write=true");
    expect(() => parseArgs(["--write=true", "--limit=5"])).toThrow(
      "--confirm-write=true"
    );
    expect(() =>
      parseArgs(["--write=true", "--confirm-write", "--limit=5"])
    ).toThrow("explicit --confirm-write=true");
    expect(
      parseArgs(["--write=true", "--confirm-write=true", "--limit=5"])
    ).toMatchObject({ write: true, confirmWrite: true, limit: 5 });
  });

  it("requires a second confirmation for full scope", () => {
    expect(() => parseArgs(["--all"])).toThrow("explicit --all=true");
    expect(() => parseArgs(["--all=true"])).toThrow("--all-confirmed=true");
    expect(parseArgs(["--all=true", "--all-confirmed=true"])).toMatchObject({
      all: true,
      allConfirmed: true,
      limit: undefined,
    });
  });

  it("rejects ambiguous or unbounded limit input", () => {
    expect(() =>
      parseArgs(["--all=true", "--all-confirmed=true", "--limit=5"])
    ).toThrow("either --limit or --all=true");
    expect(() => parseArgs(["--limit=0"])).toThrow("integer from 1 to 500");
    expect(() => parseArgs(["--limit=501"])).toThrow("integer from 1 to 500");
    expect(() => parseArgs(["--cursor=bad"])).toThrow("MongoDB ObjectId");
    expect(
      parseArgs(["--cursor=64B000000000000000000001", "--limit=5"])
    ).toMatchObject({ cursor: "64b000000000000000000001", limit: 5 });
    expect(() =>
      parseArgs([
        "--all=true",
        "--all-confirmed=true",
        "--cursor=64b000000000000000000001",
      ])
    ).toThrow("either --cursor or --all=true");
  });

  it("does not interpret dry-run=false as write permission", () => {
    expect(() => parseArgs(["--dry-run=false"])).toThrow("Use --write=true");
  });
});
