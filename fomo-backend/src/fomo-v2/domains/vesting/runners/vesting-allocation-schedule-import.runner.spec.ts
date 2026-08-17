import { parseArgs } from "./vesting-allocation-schedule-import.runner";

describe("vesting allocation/schedule import runner", () => {
  it("keeps dropstab source semantics", () => {
    expect(parseArgs(["--source-type=dropstab", "--limit=5"])).toMatchObject({
      sourceType: "dropstab",
      limit: 5,
    });
  });

  it("requires write confirmation", () => {
    expect(() => parseArgs(["--write", "--limit=5"])).toThrow(
      "--confirm-write=true"
    );
  });

  it("requires all-confirmed for all", () => {
    expect(() => parseArgs(["--all=true"])).toThrow("--all-confirmed=true");
    expect(parseArgs(["--all-confirmed=true"])).toMatchObject({
      all: false,
      allConfirmed: true,
      limit: 100,
    });
    expect(parseArgs(["--all-confirmed=true", "--all=true"])).toMatchObject({
      all: true,
      allConfirmed: true,
      limit: undefined,
    });
    expect(
      parseArgs(["--all=true", "--all-confirmed=true", "--all=false"])
    ).toMatchObject({ all: false, allConfirmed: true, limit: 100 });
  });
});
