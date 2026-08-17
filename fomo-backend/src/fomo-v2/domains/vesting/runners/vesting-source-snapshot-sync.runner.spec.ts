import { parseArgs } from "./vesting-source-snapshot-sync.runner";

describe("vesting source snapshot sync runner", () => {
  it("keeps confirmation separate from unbounded scope", () => {
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
