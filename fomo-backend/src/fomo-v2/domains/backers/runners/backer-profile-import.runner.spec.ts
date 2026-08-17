import { parseArgs } from "./backer-profile-import.runner";

describe("backer profile import runner", () => {
  it("defaults to a bounded dry run", () => {
    expect(parseArgs([])).toMatchObject({
      write: false,
      limit: 100,
      all: false,
    });
  });

  it("requires confirmation for write mode", () => {
    expect(() => parseArgs(["--write", "--limit=5"])).toThrow(
      "--confirm-write=true"
    );
    expect(
      parseArgs(["--write", "--confirm-write=true", "--limit=5"])
    ).toMatchObject({ write: true, limit: 5 });
  });

  it("requires both an explicit all request and its confirmation", () => {
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
  });

  it("restores the safe default after an explicit all=false", () => {
    expect(
      parseArgs([
        "--all=true",
        "--all=false",
        "--write=true",
        "--confirm-write=true",
      ])
    ).toMatchObject({ all: false, limit: 100, write: true });
  });
});
