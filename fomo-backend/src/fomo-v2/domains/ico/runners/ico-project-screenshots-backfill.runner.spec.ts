import { parseArgs } from "./ico-project-screenshots-backfill.runner";

describe("ICO screenshots backfill runner", () => {
  it("keeps ICODrops as the default source", () => {
    expect(parseArgs([])).toMatchObject({
      sourceType: "icodrops",
      write: false,
      limit: 100,
    });
  });

  it("requires confirmations for write and all", () => {
    expect(() => parseArgs(["--write", "--limit=5"])).toThrow(
      "--confirm-write=true"
    );
    expect(() => parseArgs(["--all"])).toThrow("--all-confirmed=true");
    expect(parseArgs(["--all-confirmed=true"])).toMatchObject({
      all: false,
      allConfirmed: true,
      limit: 100,
    });
  });
});
