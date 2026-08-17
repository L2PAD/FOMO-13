import { parseArgs } from "./coingecko-market-universe-report.runner";

describe("CoinGecko market universe report runner", () => {
  it("uses read-only defaults", () => {
    expect(parseArgs([])).toEqual({
      examplesLimit: 10,
    });
  });

  it("parses run id and examples limit", () => {
    expect(parseArgs(["--run-id=abc123", "--examples-limit=3"])).toEqual({
      runId: "abc123",
      examplesLimit: 3,
    });
  });

  it("rejects unknown options", () => {
    expect(() => parseArgs(["--write=true"])).toThrow("Unknown option --write.");
  });
});
