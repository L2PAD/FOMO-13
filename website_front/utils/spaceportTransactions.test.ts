import assert from "node:assert/strict";
import test from "node:test";
const {
  isMinedSuccessReceipt,
  resolveOpenedRewardTokenId,
} = await import(new URL("./spaceportTransactions.ts", import.meta.url).href);

test("open transaction resolves the newly added reward token", () => {
  assert.equal(resolveOpenedRewardTokenId(12, [12, 20], [20, 31]), 31);
});

test("open transaction can keep the original token id", () => {
  assert.equal(resolveOpenedRewardTokenId(12, [12, 20], [12, 20]), 12);
});

test("open transaction rejects an absent or unsafe reward token id", () => {
  assert.equal(resolveOpenedRewardTokenId(12, [12], []), undefined);
  assert.equal(
    resolveOpenedRewardTokenId(12, [], ["9007199254740992"]),
    undefined
  );
});

test("receipt success accepts numeric and hex statuses", () => {
  assert.equal(isMinedSuccessReceipt({ status: 1 }), true);
  assert.equal(isMinedSuccessReceipt({ status: "0x1" }), true);
});

test("receipt success rejects failed or incomplete receipts", () => {
  assert.equal(isMinedSuccessReceipt({ status: 0 }), false);
  assert.equal(isMinedSuccessReceipt({ status: "0x0" }), false);
  assert.equal(isMinedSuccessReceipt({ transactionHash: "0xabc" }), false);
});
