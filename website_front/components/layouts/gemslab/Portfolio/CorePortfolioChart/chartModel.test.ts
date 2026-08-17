import assert from "node:assert/strict";
import test from "node:test";

const {
  buildSensitiveDomain,
  createPortfolioAxisFormatter,
  getReadableAuxiliaryValues,
} = await import(new URL("./chartModel.ts", import.meta.url).href);

test("varying domains remain sensitive to tiny relative movements", () => {
  const domain = buildSensitiveDomain([100_000, 100_000.01], {
    clampMinimumAtZero: true,
    flatPadding: 1,
    paddingRatio: 0.1,
  });

  assert.equal(domain[0] > 99_999.99, true);
  assert.equal(domain[1] < 100_000.02, true);
});

test("axis labels stay unique for tiny changes on a large balance", () => {
  const values = [1_000_000, 1_000_000.0025, 1_000_000.005];
  const formatter = createPortfolioAxisFormatter(values, "balance");
  const labels = values.map(formatter);

  assert.equal(new Set(labels).size, values.length);
  assert.equal(
    labels.every((label) => String(label).includes("$")),
    true
  );
});

test("an auxiliary line cannot flatten the primary series", () => {
  const primaryValues = [100_000, 100_000.01, 100_000.005];

  assert.deepEqual(
    getReadableAuxiliaryValues(primaryValues, [90_000, 90_000]),
    []
  );
  assert.deepEqual(
    getReadableAuxiliaryValues(primaryValues, [99_999.99, 100_000]),
    [99_999.99, 100_000]
  );
});

test("flat domains use their explicit fallback padding", () => {
  assert.deepEqual(
    buildSensitiveDomain([25, 25], {
      flatPadding: 0.5,
      paddingRatio: 0.1,
    }),
    [24.5, 25.5]
  );
});
