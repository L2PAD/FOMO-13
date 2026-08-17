import { parseArgs } from "./funding-import-dry-run.runner";

describe("funding-import runner source policy", () => {
  it("rejects icodrops in generic funding-import", () => {
    expect(() => parseArgs(["--source-type=icodrops"])).toThrow(
      "ICODrops funding is only allowed via explicit ico funding fallback flow"
    );
  });

  it("allows supported dropstab source type", () => {
    expect(parseArgs(["--source-type=drop-stab", "--limit=5"])).toMatchObject({
      sourceType: "dropstab",
      limit: 5,
      write: false,
      enrichOnly: false,
    });
  });

  it("uses enrich-only mode by default for write", () => {
    expect(
      parseArgs([
        "--write",
        "--confirm-write=true",
        "--limit=5",
        "--snapshot-id=snapshot-1",
      ])
    ).toMatchObject({
      limit: 5,
      write: true,
      enrichOnly: true,
    });
  });

  it("allows explicit full import write mode", () => {
    expect(
      parseArgs([
        "--write",
        "--confirm-write=true",
        "--full-import",
        "--limit=5",
        "--snapshot-id=snapshot-1",
      ])
    ).toMatchObject({ limit: 5, write: true, enrichOnly: false });
  });

  it("requires explicit write confirmation", () => {
    expect(() => parseArgs(["--write", "--limit=5"])).toThrow(
      "--confirm-write=true"
    );
  });

  it("rejects mutable collection write without a snapshot", () => {
    expect(() =>
      parseArgs(["--write", "--confirm-write=true", "--limit=5"])
    ).toThrow("requires --snapshot-id");
  });

  it("rejects misspelled boolean flags", () => {
    expect(() => parseArgs(["--write=flase", "--limit=5"])).toThrow(
      "Invalid --write boolean value"
    );
  });

  it("accepts a project filter", () => {
    expect(parseArgs(["--project=solana", "--limit=1"])).toMatchObject({
      project: "solana",
      limit: 1,
    });
  });
});
