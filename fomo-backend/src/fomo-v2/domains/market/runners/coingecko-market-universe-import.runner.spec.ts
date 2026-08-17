import { parseArgs } from "./coingecko-market-universe-import.runner";

describe("CoinGecko market universe import runner", () => {
  it("keeps explicit limit without capping to 1000", () => {
    const args = parseArgs(["--mode=write", "--confirm-write=true", "--limit=3000"]);

    expect(args).toMatchObject({
      mode: "write",
      confirmWrite: true,
      limit: 3000,
      all: false,
    });
  });

  it("parses all mode", () => {
    const args = parseArgs(["--mode=write", "--confirm-write=true", "--all=true"]);

    expect(args.mode).toBe("write");
    expect(args.confirmWrite).toBe(true);
    expect(args.all).toBe(true);
  });
});
