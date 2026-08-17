import {
  calculateTradeReputation,
  logNormalize,
} from "./unified-rating.engine";
import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";

const cfg = buildDefaultUnifiedRatingConfig();

describe("logNormalize (heavy-tailed counts)", () => {
  it("maps 0 -> 0 and cap -> 100", () => {
    expect(logNormalize(0, 1_000_000)).toBe(0);
    expect(Math.round(logNormalize(1_000_000, 1_000_000))).toBe(100);
  });
  it("is monotonic and compresses the tail (500k is NOT 500x of 1k)", () => {
    const a = logNormalize(1_000, 1_000_000);
    const b = logNormalize(500_000, 1_000_000);
    expect(b).toBeGreaterThan(a);
    expect(b / a).toBeLessThan(10); // linear would be ~500x
  });
});

describe("Unified Trade Reputation — reputation carries across markets", () => {
  const strongP2P = {
    otc: {}, // never traded OTC
    p2p: {
      volume: 300_000,
      completedTrades: 80,
      avgReview: 4.9,
      reviewCount: 60,
      uniqueCounterparties: 40,
      lostDisputes: 0,
    },
  };

  it("P2P-only trader gets a high UNIFIED score and rank, OTC experience = 0", () => {
    const r = calculateTradeReputation(strongP2P.otc, strongP2P.p2p, cfg.users.trade);
    expect(r.p2pExperience).toBeGreaterThan(50);
    expect(r.otcExperience).toBe(0);
    expect(r.sharedCore).toBeGreaterThan(50);
    // Unified reputation carries over — NOT dragged to ~half by the empty OTC side.
    expect(r.combinedTradeScore).toBeGreaterThan(50);
    expect(r.tradeRank).not.toBe("");
    // The whole point: unified >> OTC-specific experience.
    expect(r.combinedTradeScore).toBeGreaterThan(r.otcExperience + 20);
  });

  it("is symmetric: OTC-only trader carries the same core into P2P", () => {
    const r = calculateTradeReputation(strongP2P.p2p, {}, cfg.users.trade);
    expect(r.otcExperience).toBeGreaterThan(50);
    expect(r.p2pExperience).toBe(0);
    expect(r.combinedTradeScore).toBeGreaterThan(50);
  });

  it("no trades -> unified 0", () => {
    const r = calculateTradeReputation({}, {}, cfg.users.trade);
    expect(r.combinedTradeScore).toBe(0);
  });

  it("critical fraud blocks the unified rank", () => {
    const r = calculateTradeReputation(
      { completedTrades: 10, criticalFraud: true },
      strongP2P.p2p,
      cfg.users.trade
    );
    expect(r.combinedTradeScore).toBe(0);
  });

  it("shared core uses POOLED totals (both directions raise the core)", () => {
    const single = calculateTradeReputation(
      { volume: 50_000, completedTrades: 10, avgReview: 4.5, reviewCount: 8, uniqueCounterparties: 5 },
      {},
      cfg.users.trade
    );
    const both = calculateTradeReputation(
      { volume: 50_000, completedTrades: 10, avgReview: 4.5, reviewCount: 8, uniqueCounterparties: 5 },
      { volume: 50_000, completedTrades: 10, avgReview: 4.5, reviewCount: 8, uniqueCounterparties: 5 },
      cfg.users.trade
    );
    expect(both.sharedCore).toBeGreaterThan(single.sharedCore);
  });
});
