import { hasFundingRoundToken } from "./funding-round-token.util";

describe("hasFundingRoundToken", () => {
  it("does not treat tokenomics or token sale stages as live token proof", () => {
    expect(
      hasFundingRoundToken(
        {
          name: "Anthropic",
          slug: "anthropic",
          tokenomics: { allocation: "private" },
          rawIcoData: {
            tokenomics: { sale: "strategic" },
            ico: { price: 1 },
            ido: { platform: "example" },
            ieo: { platform: "example" },
            icoPrice: 1,
          },
        },
        { stage: "Private Sale", type: "Strategic Sale" },
      ),
    ).toBe(false);
  });

  it("does not treat generated slug-like token symbols as live token proof", () => {
    expect(
      hasFundingRoundToken(
        {
          name: "Foundation Devices",
          slug: "foundation-devices",
          tokenSymbol: "FOUNDATION-DEVICES",
          ticker: "FOUNDATION-DEVICES",
        },
        {},
      ),
    ).toBe(false);

    expect(
      hasFundingRoundToken(
        {
          name: "K25.ai",
          slug: "k25-ai",
          rawIcoData: { tokenSymbol: "K25-AI", ticker: "K25-AI" },
        },
        {},
      ),
    ).toBe(false);
  });

  it("does not treat private sale stage alone as live token proof", () => {
    expect(hasFundingRoundToken(null, { stage: "private sale" })).toBe(false);
  });

  it("does not treat fdv, tgeDate, or tokenomics alone as live token proof", () => {
    expect(
      hasFundingRoundToken(
        {
          name: "Equity Project",
          slug: "equity-project",
          fdv: 1000000,
          tgeDate: new Date("2025-01-01"),
          tokenomics: { supply: "1B" },
          tokenMetrics: { fdv: 1000000 },
          rawIcoData: {
            fdv: 1000000,
            tgeDate: "2025-01-01",
            tokenomics: { supply: "1B" },
          },
        },
        {},
      ),
    ).toBe(false);
  });

  it("does not use project.symbol as token proof", () => {
    expect(
      hasFundingRoundToken(
        {
          name: "Only Symbol",
          slug: "only-symbol",
          symbol: "TOKEN",
        },
        {},
      ),
    ).toBe(false);
  });

  it("does not treat generic company-like symbols as live token proof", () => {
    expect(hasFundingRoundToken({ name: "Gensyn", slug: "not-gensyn", tokenSymbol: "AI" }, {})).toBe(false);
    expect(hasFundingRoundToken({ name: "Billions", slug: "not-billions", ticker: "BILL" }, {})).toBe(false);
  });

  it("treats provider ids as strong token proof", () => {
    expect(hasFundingRoundToken({ name: "CoinGecko Project", coingeckoId: "example-token" }, {})).toBe(true);
    expect(hasFundingRoundToken({ name: "CMC Project", coinmarketcapId: "12345" }, {})).toBe(true);
    expect(hasFundingRoundToken({ name: "Metrics Project", tokenMetrics: { coingeckoId: "metrics-token" } }, {})).toBe(true);
    expect(
      hasFundingRoundToken(
        {
          name: "Raw CMC Project",
          rawIcoData: { coinMarketCapId: "67890" },
        },
        {},
      ),
    ).toBe(true);
  });

  it("treats verified token project slugs as temporary trusted mappings", () => {
    expect(hasFundingRoundToken({ name: "Centrifuge", slug: "centrifuge" }, {})).toBe(true);
    expect(hasFundingRoundToken({ name: "Houdini Swap", slug: "houdini-swap" }, {})).toBe(true);
  });
});
