import assert from "node:assert/strict";
import test from "node:test";
import {
  amountToRaw,
  clearLaunchpadRecovery,
  formatTimeUntil,
  fundingProgress,
  isLaunchpadAd,
  isLaunchpadFeatured,
  isCurrentLaunchpadInvestZone,
  lifecycleTimelineIndex,
  mapLaunchpadDetailToView,
  mapLaunchpadSummaryToCard,
  normalizeLaunchpadZone,
  parseLaunchpadRecovery,
  readLaunchpadRecovery,
  saveLaunchpadRecovery,
  validateInvestmentAmount,
} from "./fomoV2Launchpad";

const makeLaunchpadDetail = (overrides: Record<string, any> = {}) => ({
  id: "launch-1",
  slug: "launch-1",
  status: "published",
  publicationStatus: "published",
  lifecycle: "claim",
  project: {
    id: "project-1",
    name: "Project One",
    description: "Project description",
  },
  launch: {
    title: "Project One Launch",
    flags: {},
  },
  pool: {
    poolId: "1",
    createParams: {
      targetAmount: "1000",
      stakeStartTime: "1100",
      greenStartTime: "1200",
      greenEndTime: "1300",
      yellowSeats: "2",
      slotDuration: "100",
      minInvestmentAmount: "1",
    },
    onchainState: {
      targetAmount: "1000",
      raisedAmount: "100",
    },
  },
  contract: {
    chainId: 97,
    address: "0x0608B52aAC58E7313481d0809E8b4525BDD11d33",
    investToken: {
      address: "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948",
      symbol: "USDT",
      decimals: 18,
    },
    projectToken: {
      address: "0x1111111111111111111111111111111111111111",
      symbol: "PRJ",
      decimals: 18,
    },
  },
  participation: {
    wallet: "0x2222222222222222222222222222222222222222",
    receiptTokenIds: ["7"],
    activeStakedTokenIds: [],
    activeStakeCount: 0,
    investedAmount: "100",
    claimAmount: "100",
    claimKind: "project_token",
    claimAsset: {
      address: "0x1111111111111111111111111111111111111111",
      symbol: "PRJ",
      decimals: 18,
    },
    claimed: false,
    canClaim: true,
    canRefund: false,
    maxAllowedNow: "0",
  },
  leaderboard: [],
  ...overrides,
});

test("amount conversion keeps 18-decimal precision", () => {
  assert.equal(amountToRaw("1.000000000000000001", 18), 1_000_000_000_000_000_001n);
});

test("investment validation compares bigint raw amounts", () => {
  assert.deepEqual(validateInvestmentAmount("0.5", 18, "1000000000000000000", "0"), {
    error: "Investment amount is below the minimum.",
  });
  assert.equal(validateInvestmentAmount("2", 18, "1000000000000000000", "3000000000000000000").raw, 2_000_000_000_000_000_000n);
});

test("funding progress is capped and never converts token values to number", () => {
  assert.equal(fundingProgress("500000000000000000000", "1000000000000000000000"), 50);
  assert.equal(fundingProgress("2000", "1000"), 100);
});

test("refund is not inferred by lifecycle mapper", () => {
  assert.equal(lifecycleTimelineIndex("closed_awaiting_settlement"), 2);
  assert.equal(lifecycleTimelineIndex("claim"), 2);
});

test("timeline state covers every pool lifecycle without opening the wrong phase", () => {
  assert.deepEqual(
    [
      "scheduled",
      "staking",
      "green",
      "yellow",
      "ended_awaiting_close",
      "closed_awaiting_settlement",
      "claim",
      "completed",
    ].map((lifecycle) => [lifecycle, lifecycleTimelineIndex(lifecycle as any)]),
    [
      ["scheduled", 0],
      ["staking", 0],
      ["green", 1],
      ["yellow", 1],
      ["ended_awaiting_close", 1],
      ["closed_awaiting_settlement", 2],
      ["claim", 2],
      ["completed", 2],
    ]
  );
});

test("deadline formatter treats exact and past deadlines as ended", () => {
  assert.equal(formatTimeUntil("1000", 1000n), "Ended");
  assert.equal(formatTimeUntil("999", 1000n), "Ended");
  assert.equal(formatTimeUntil("1060", 1000n), "1m");
  assert.equal(formatTimeUntil("91061", 1000n), "1d 1h");
});

test("yellow deadline moves from slot opening to the active slot end", () => {
  const originalNow = Date.now;
  try {
    Date.now = () => 1_000_000;
    const beforeSlot = makeLaunchpadDetail({
      lifecycle: "yellow",
      participation: {
        ...makeLaunchpadDetail().participation,
        yellowSlotStart: "1100",
        yellowSlotEnd: "1300",
      },
    });
    assert.equal(mapLaunchpadSummaryToCard(beforeSlot as any).timeLeft, "1m");

    Date.now = () => 1_150_000;
    assert.equal(mapLaunchpadSummaryToCard(beforeSlot as any).timeLeft, "2m");
  } finally {
    Date.now = originalNow;
  }
});

test("countdown visibility flag suppresses all lifecycle deadlines", () => {
  const detail = makeLaunchpadDetail({
    lifecycle: "green",
    launch: { title: "Project One Launch", flags: { showCountdown: false } },
  });
  assert.equal(mapLaunchpadSummaryToCard(detail as any).timeLeft, undefined);
});

test("NFT card countdown names the next launch stage", () => {
  const labels = [
    ["scheduled", "Staking opens in"],
    ["staking", "Purchase opens in"],
    ["green", "Distribution opens in"],
    ["yellow", "Distribution opens in"],
    ["claim", "Distribution"],
  ] as const;

  labels.forEach(([lifecycle, expected]) => {
    const detail = makeLaunchpadDetail({ lifecycle });
    assert.equal(mapLaunchpadDetailToView(detail as any).nftStaked.countdownLabel, expected);
  });
});

test("under-target project-token claim is not rewritten into a refund", () => {
  const detail = makeLaunchpadDetail({ lifecycle: "claim" });
  const mapped = mapLaunchpadDetailToView(detail as any);
  assert.equal(mapped.ido.progress, 10);
  assert.equal(mapped.claimDisplay.isRefund, false);
  assert.equal(mapped.claimDisplay.symbol, "PRJ");
});

test("refund display requires the explicit backend refund signal", () => {
  const base = makeLaunchpadDetail();
  const byKind = makeLaunchpadDetail({
    participation: {
      ...base.participation,
      claimKind: "payment_token_refund",
      claimAsset: base.contract.investToken,
    },
  });
  const byCapability = makeLaunchpadDetail({
    participation: {
      ...base.participation,
      claimKind: "project_token",
      canRefund: true,
      claimAsset: base.contract.investToken,
    },
  });
  assert.equal(mapLaunchpadDetailToView(byKind as any).claimDisplay.isRefund, true);
  assert.equal(mapLaunchpadDetailToView(byCapability as any).claimDisplay.isRefund, true);
});

test("allocation stays hidden until claim and then uses the claimed project-token amount", () => {
  const base = makeLaunchpadDetail();
  const claimAmount = "500000000000000000000";
  const leaderboardEntry = {
    wallet: "0x3333333333333333333333333333333333333333",
    activeStakeCount: 2,
    rank: "1",
    zone: 1,
    claimAmount,
  };
  const unclaimed = makeLaunchpadDetail({
    lifecycle: "green",
    participation: {
      ...base.participation,
      claimed: false,
      investedAmount: "1000000000000000000",
      maxAllowedNow: "1000000000000000000",
    },
    leaderboard: [{ ...leaderboardEntry, claimed: false }],
  });
  const unclaimedView = mapLaunchpadDetailToView(unclaimed as any);
  assert.equal(unclaimedView.allocation.amount, "—");
  assert.equal(unclaimedView.claimDisplay.investment, "1 USDT");
  assert.equal(unclaimedView.leaderboard[0].allocation, "—");

  const claimed = makeLaunchpadDetail({
    lifecycle: "claim",
    participation: {
      ...base.participation,
      claimed: true,
      claimAmount,
    },
    leaderboard: [{ ...leaderboardEntry, claimed: true }],
  });
  const claimedView = mapLaunchpadDetailToView(claimed as any);
  assert.equal(claimedView.allocation.amount, "500 PRJ");
  assert.equal(claimedView.leaderboard[0].allocation, "500 PRJ");
});

test("zone zero with an active stake maps to the waiting zone", () => {
  assert.equal(normalizeLaunchpadZone(0, 1), "red");
  assert.equal(normalizeLaunchpadZone(0, 0), "none");
});

test("invest eligibility only accepts the zone whose purchase phase is active", () => {
  assert.equal(isCurrentLaunchpadInvestZone("green", "green"), true);
  assert.equal(isCurrentLaunchpadInvestZone("green", "yellow"), false);
  assert.equal(isCurrentLaunchpadInvestZone("yellow", "yellow"), true);
  assert.equal(isCurrentLaunchpadInvestZone("yellow", "green"), false);
  assert.equal(isCurrentLaunchpadInvestZone("staking", "green"), false);
});

test("recovery parser rejects malformed transaction hashes", () => {
  assert.equal(parseLaunchpadRecovery('{"txHash":"0x123"}'), null);
});

test("featured and ad output require their explicit placement flags", () => {
  assert.equal(isLaunchpadAd({ placement: { ad: true } } as any), true);
  assert.equal(isLaunchpadAd({ placement: { ad: false } } as any), false);
  assert.equal(isLaunchpadAd({} as any), false);
  assert.equal(isLaunchpadFeatured({ placement: { featured: true } } as any), true);
  assert.equal(isLaunchpadFeatured({ placement: { featured: false } } as any), false);
});

test("unavailable browser storage cannot break transaction recovery flow", () => {
  const previousWindow = (globalThis as any).window;
  (globalThis as any).window = {
    localStorage: {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    },
  };
  try {
    assert.equal(readLaunchpadRecovery("launch", "0xabc"), null);
    assert.doesNotThrow(() => saveLaunchpadRecovery({
      launchpadId: "launch",
      wallet: "0xabc",
      txHash: `0x${"1".repeat(64)}`,
      action: "invest",
      createdAt: new Date(0).toISOString(),
    }));
    assert.doesNotThrow(() => clearLaunchpadRecovery("launch", "0xabc"));
  } finally {
    if (previousWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = previousWindow;
  }
});
