import { parseArgs } from "./ico-project-profile-import.runner";

describe("ICO project profile import runner", () => {
  it("keeps the explicit source type", () => {
    expect(parseArgs(["--source-type=icodrops", "--limit=5"])).toMatchObject({
      sourceType: "icodrops",
      limit: 5,
    });
  });

  it("requires write confirmation", () => {
    expect(() => parseArgs(["--write", "--limit=5"])).toThrow(
      "--confirm-write=true"
    );
  });

  it("rejects all without all-confirmed", () => {
    expect(() => parseArgs(["--all=true"])).toThrow("--all-confirmed=true");
    expect(parseArgs(["--all-confirmed=true"])).toMatchObject({
      all: false,
      allConfirmed: true,
    });
  });

  it("requires an explicit compatibility flag for rows without source", () => {
    expect(parseArgs(["--limit=5"]).includeLegacyMissingSource).toBe(false);
    expect(
      parseArgs(["--limit=5", "--include-legacy-missing-source=true"])
        .includeLegacyMissingSource
    ).toBe(true);
  });
});
