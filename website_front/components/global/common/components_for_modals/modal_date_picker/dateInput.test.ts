import assert from "node:assert/strict";
import test from "node:test";

const {
  formatDateInputValue,
  getDateInputEventValue,
  normalizeDateInput,
  toValidDate,
  validateDateInput,
} = await import(new URL("./dateInput.ts", import.meta.url).href);

test("normalizes digit-only and pasted date input", () => {
  assert.equal(normalizeDateInput("01022024"), "01.02.2024");
  assert.equal(normalizeDateInput("1/2/2024"), "1.2.2024");
  assert.equal(normalizeDateInput("01-02-2024"), "01.02.2024");
  const isoPaste = normalizeDateInput("2024-02-29T00:00:00.000Z");
  assert.notEqual(isoPaste, "20.02.2900");
  assert.notEqual(
    validateDateInput(isoPaste).status,
    "valid",
    "an ISO paste must not silently become a different calendar date"
  );
});

test("only reads raw values from input events", () => {
  assert.equal(
    getDateInputEventValue({ nodeName: "INPUT", value: "01.02.2024" }),
    "01.02.2024"
  );
  assert.equal(
    getDateInputEventValue({ nodeName: "DIV", value: undefined }),
    null
  );
  assert.equal(
    getDateInputEventValue({ nodeName: "BUTTON", value: "calendar-day" }),
    null
  );
});

test("accepts real calendar dates and canonicalizes their display", () => {
  const result = validateDateInput("29.02.2024");

  assert.equal(result.status, "valid");
  if (result.status === "valid") {
    assert.equal(formatDateInputValue(result.date), "29.02.2024");
  }
});

test("rejects impossible dates and non-four-digit years", () => {
  assert.deepEqual(validateDateInput("29.02.2023"), {
    status: "invalid",
    reason: "date",
  });
  assert.deepEqual(validateDateInput("31.04.2024"), {
    status: "invalid",
    reason: "date",
  });
  assert.equal(validateDateInput("01.01.24").status, "incomplete");
});

test("applies min and max limits by local calendar day", () => {
  const minDate = new Date(2024, 1, 10, 23, 59);
  const maxDate = new Date(2024, 1, 20, 0, 1);

  assert.equal(
    validateDateInput("10.02.2024", minDate, maxDate).status,
    "valid"
  );
  assert.equal(
    validateDateInput("20.02.2024", minDate, maxDate).status,
    "valid"
  );
  assert.deepEqual(validateDateInput("09.02.2024", minDate, maxDate), {
    status: "invalid",
    reason: "before-min",
  });
  assert.deepEqual(validateDateInput("21.02.2024", minDate, maxDate), {
    status: "invalid",
    reason: "after-max",
  });
});

test("parses date-only ISO strings as local calendar dates", () => {
  const parsed = toValidDate("2024-02-29");

  assert.ok(parsed);
  assert.equal(formatDateInputValue(parsed), "29.02.2024");
  assert.equal(toValidDate("not-a-date"), null);
});

test("parses full API ISO timestamps without reordering their digits", () => {
  const source = "2025-07-25T12:34:56.789Z";
  const parsed = toValidDate(source);

  assert.ok(parsed);
  assert.equal(parsed.toISOString(), source);
  assert.notEqual(parsed.getFullYear(), 2512);
});
