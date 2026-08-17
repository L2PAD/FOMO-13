import { parseArgs } from "./icodrops-funding-fallback-import.runner";

describe("icodrops-funding-fallback runner", () => {
  it("does not accept --source-type because the importer is explicit", () => {
    expect(() => parseArgs(["--source-type=icodrops"])).toThrow(
      /does not accept --source-type/
    );
  });

  it("requires limit or all-confirmed for write mode", () => {
    expect(() => parseArgs(["--write", "--confirm-write=true"])).toThrow(
      /requires --limit or --all-confirmed/
    );
  });

  it("requires explicit confirmation for a bounded write", () => {
    expect(() => parseArgs(["--write", "--limit=10"])).toThrow(
      "--confirm-write=true"
    );
  });

  it("requires all-confirmed for an unbounded dry run too", () => {
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
    expect(parseArgs(["--all-confirmed=true", "--all=true"])).toMatchObject({
      all: true,
      allConfirmed: true,
    });
    expect(
      parseArgs(["--all=true", "--all-confirmed=true", "--all=false"])
    ).toMatchObject({ all: false, allConfirmed: true, limit: 100 });
  });

  it("defaults to dry-run with a small limit", () => {
    expect(parseArgs([])).toMatchObject({
      write: false,
      all: false,
      limit: 100,
    });
  });
});
