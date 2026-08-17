import assert from "node:assert/strict";
import test from "node:test";

const {
  fulfilledValues,
  hasOnlyAvailableNftSelection,
  mergeStakeableNftTokenIds,
  settledValue,
} = await import(new URL("./launchpadParticipation.ts", import.meta.url).href);

const fulfilled = <T>(value: T): PromiseFulfilledResult<T> => ({
  status: "fulfilled",
  value,
});

const rejected = (reason = new Error("RPC unavailable")): PromiseRejectedResult => ({
  status: "rejected",
  reason,
});

test("allowance failure does not erase a successful token balance read", () => {
  assert.equal(settledValue(rejected(), 0n), 0n);
  assert.equal(settledValue(fulfilled(42n), 0n), 42n);
});

test("balance failure does not erase a successful allowance read", () => {
  assert.equal(settledValue(fulfilled(17n), 0n), 17n);
  assert.equal(settledValue(rejected(), 0n), 0n);
});

test("NFT approval and balance failures retain their independent successful values", () => {
  assert.equal(settledValue(rejected(), false), false);
  assert.equal(settledValue(fulfilled(3n), 0n), 3n);
  assert.equal(settledValue(fulfilled(true), false), true);
  assert.equal(settledValue(rejected(), 0n), 0n);
});

test("partial NFT enumeration keeps IDs returned by healthy RPC calls", () => {
  assert.deepEqual(
    fulfilledValues([fulfilled(5n), rejected(), fulfilled(9n)]),
    [5n, 9n]
  );
});

test("wallet-owned and reusable NFT IDs are merged without duplicates", () => {
  assert.deepEqual(mergeStakeableNftTokenIds([5n, 9n], [9n, 12n]), [5n, 9n, 12n]);
});

test("NFT selection rejects empty, duplicate, and stale token IDs", () => {
  const available = [5n, 9n, 12n];
  assert.equal(hasOnlyAvailableNftSelection([], available), false);
  assert.equal(hasOnlyAvailableNftSelection([5n, 5n], available), false);
  assert.equal(hasOnlyAvailableNftSelection([5n, 99n], available), false);
  assert.equal(hasOnlyAvailableNftSelection([12n, 5n], available), true);
});
