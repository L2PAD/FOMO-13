import { parseArgs } from "./unlock-events-import.runner";

describe("unlock events import runner", () => {
  it("keeps dropstab source semantics", () => {
    expect(parseArgs(["--source=drop-stab", "--limit=5"])).toMatchObject({
      source: "dropstab",
      sourceType: "dropstab",
      limit: 5,
    });
  });

  it("requires write confirmation", () => {
    expect(() => parseArgs(["--write", "--limit=5"])).toThrow(
      "--confirm-write=true"
    );
  });

  it("allows an explicitly confirmed all import", () => {
    expect(
      parseArgs([
        "--write",
        "--confirm-write=true",
        "--all=true",
        "--all-confirmed=true",
      ])
    ).toMatchObject({ write: true, all: true, allConfirmed: true });
    expect(parseArgs(["--all-confirmed=true"])).toMatchObject({
      all: false,
      allConfirmed: true,
      limit: 100,
    });
  });
});
