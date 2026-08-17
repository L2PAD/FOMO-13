export const DATE_INPUT_FORMAT = "dd.MM.yyyy";
export const DATE_INPUT_PLACEHOLDER = "DD.MM.YYYY";

export type DateInputValidation =
  | { status: "empty" }
  | { status: "incomplete" }
  | {
      status: "invalid";
      reason: "format" | "date" | "before-min" | "after-max";
    }
  | { status: "valid"; date: Date };

const COMPLETE_DATE_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const PARTIAL_DATE_PATTERN = /^\d{0,2}(?:\.\d{0,2}(?:\.\d{0,4})?)?$/;

const isValidDate = (value: Date | null): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const createLocalDate = (
  year: number,
  month: number,
  day: number
): Date | null => {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1) {
    return null;
  }

  // setFullYear avoids JavaScript's special 1900 offset for years from 0 to 99.
  const result = new Date(0);
  result.setHours(0, 0, 0, 0);
  result.setFullYear(year, month - 1, day);

  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day
  ) {
    return null;
  }

  return result;
};

const calendarDayValue = (date: Date): number =>
  date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate();

export const formatDateInputValue = (date: Date | null): string => {
  if (!isValidDate(date)) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}.${month}.${date.getFullYear()}`;
};

/**
 * Keeps typing predictable while supporting digit-only input and pasted
 * values such as `1/2/2024`.
 */
export const normalizeDateInput = (value: string): string => {
  const trimmed = value.trim();

  // Do not silently turn arbitrary/API strings into a different valid date.
  // Unsupported input remains visible and is rejected by validateDateInput.
  if (/[^\d./-]/.test(trimmed)) return trimmed.slice(0, 10);

  const sanitized = trimmed.replace(/[/-]/g, ".");

  if (!sanitized.includes(".")) {
    const digits = sanitized.slice(0, 8);
    const groups = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];

    return groups.filter(Boolean).join(".");
  }

  const parts = sanitized.split(".").slice(0, 3);
  const limitedParts = parts.map((part, index) =>
    part.slice(0, index === 2 ? 4 : 2)
  );

  return limitedParts.join(".").slice(0, 10);
};

export const getDateInputEventValue = (
  target: { nodeName?: string; value?: unknown } | null
): string | null =>
  target?.nodeName?.toUpperCase() === "INPUT" &&
  typeof target.value === "string"
    ? target.value
    : null;

export const toValidDate = (value?: Date | string | null): Date | null => {
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  if (/^(?:\d{8}|\d{1,2}[./-]\d{1,2}[./-]\d{4})$/.test(trimmed)) {
    const parsedInput = validateDateInput(normalizeDateInput(trimmed));
    if (parsedInput.status === "valid") return parsedInput.date;
  }

  const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDateOnly) {
    return createLocalDate(
      Number(isoDateOnly[1]),
      Number(isoDateOnly[2]),
      Number(isoDateOnly[3])
    );
  }

  const parsed = new Date(trimmed);
  return isValidDate(parsed) ? parsed : null;
};

export const validateDateInput = (
  value: string,
  minDate?: Date | null,
  maxDate?: Date | null
): DateInputValidation => {
  const normalized = value.trim().replace(/[/-]/g, ".");
  if (!normalized) return { status: "empty" };

  const match = COMPLETE_DATE_PATTERN.exec(normalized);
  if (!match) {
    return PARTIAL_DATE_PATTERN.test(normalized)
      ? { status: "incomplete" }
      : { status: "invalid", reason: "format" };
  }

  const date = createLocalDate(
    Number(match[3]),
    Number(match[2]),
    Number(match[1])
  );
  if (!date) return { status: "invalid", reason: "date" };

  const candidateMinDate = minDate ?? null;
  const candidateMaxDate = maxDate ?? null;
  const validMinDate = isValidDate(candidateMinDate) ? candidateMinDate : null;
  const validMaxDate = isValidDate(candidateMaxDate) ? candidateMaxDate : null;

  if (validMinDate && calendarDayValue(date) < calendarDayValue(validMinDate)) {
    return { status: "invalid", reason: "before-min" };
  }

  if (validMaxDate && calendarDayValue(date) > calendarDayValue(validMaxDate)) {
    return { status: "invalid", reason: "after-max" };
  }

  return { status: "valid", date };
};
