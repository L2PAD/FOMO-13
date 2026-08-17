import { parseArgs } from "./intel-fundraising-gap-fill-dry-run.runner";
import { FomoV2IntelFundraisingGapFillDryRunService } from "../services";

describe("intel-fundraising-gap-fill runner", () => {
  it("supports marketless-only canonical filtering", () => {
    expect(
      parseArgs(["--marketless-only", "--feed-rounds", "--limit=5"])
    ).toMatchObject({
      canonicalMarketlessOnly: true,
      feedRounds: true,
      limit: 5,
      write: false,
    });
  });

  it("supports parser source document id filtering", () => {
    expect(
      parseArgs([
        "--source-document-ids=6a296ffee96469e6c091d311,6a296fffe96469e6c091d811",
        "--feed-rounds",
        "--limit=5",
      ])
    ).toMatchObject({
      sourceDocumentIds: [
        "6a296ffee96469e6c091d311",
        "6a296fffe96469e6c091d811",
      ],
      feedRounds: true,
      limit: 5,
    });
  });

  it("keeps source filtering while enforcing write confirmation", () => {
    expect(() =>
      parseArgs([
        "--write",
        "--feed-rounds",
        "--source-type=intel_fundraising",
        "--limit=5",
      ])
    ).toThrow("--confirm-write=true");

    expect(
      parseArgs([
        "--write",
        "--confirm-write=true",
        "--feed-rounds",
        "--source-type=intel_fundraising",
        "--limit=5",
      ])
    ).toMatchObject({
      write: true,
      sourceType: "intel_fundraising",
      limit: 5,
    });
  });

  it("rejects all without all-confirmed", () => {
    expect(() => parseArgs(["--all=true"])).toThrow("--all-confirmed=true");
    expect(parseArgs(["--all-confirmed=true"])).toMatchObject({
      all: false,
      allConfirmed: true,
      limit: 100,
    });
  });

  it("keeps confirmation independent from scope option order", () => {
    expect(
      parseArgs(["--all-confirmed=true", "--limit=10", "--all=true"])
    ).toMatchObject({ all: true, allConfirmed: true, limit: undefined });
    expect(
      parseArgs(["--all=true", "--all-confirmed=true", "--limit=10"])
    ).toMatchObject({ all: false, allConfirmed: true, limit: 10 });
  });

  it("does not let allConfirmed select unbounded direct service scope", async () => {
    const service = new (FomoV2IntelFundraisingGapFillDryRunService as any)(
      ...new Array(30).fill(undefined)
    );

    await expect(
      service.run({ write: true, allConfirmed: true })
    ).rejects.toThrow("confirmed --all");
    await expect(service.run({ all: true })).rejects.toThrow(
      "--all requires --all-confirmed"
    );
  });
});
