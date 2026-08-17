export type CryptoActivityDateStatus = "Active" | "Upcoming" | "Ended";

type ResolveCryptoActivityStatusInput = {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  approxStartDate?: Date | string | null;
  approxEndDate?: Date | string | null;
  fallbackStatus?: string | null;
  now?: Date | number;
};

export function normalizeCryptoActivityStatus(status?: string | null): CryptoActivityDateStatus {
  const normalized = String(status || "").replace(/[\s_-]/g, "").toUpperCase();

  if (["UPCOMING", "SOON"].includes(normalized)) return "Upcoming";
  if (["ENDED", "FINISHED", "CLOSED", "CANCELED", "CANCELLED"].includes(normalized)) return "Ended";

  return "Active";
}

export function resolveCryptoActivityStatus(
  input: ResolveCryptoActivityStatusInput,
): CryptoActivityDateStatus {
  const nowMs = input.now instanceof Date
    ? input.now.getTime()
    : typeof input.now === "number"
      ? input.now
      : Date.now();
  const startMs = activityDateBoundaryMs(input.startDate ?? input.approxStartDate, "start");
  const endMs = activityDateBoundaryMs(input.endDate ?? input.approxEndDate, "end");

  if (endMs !== undefined && nowMs > endMs) return "Ended";
  if (startMs !== undefined && nowMs < startMs) return "Upcoming";
  if (startMs !== undefined || endMs !== undefined) return "Active";

  return normalizeCryptoActivityStatus(input.fallbackStatus);
}

export function activityDateBoundaryMs(
  value: Date | string | null | undefined,
  boundary: "start" | "end",
): number | undefined {
  const date = parseCryptoActivityDate(value);
  if (!date) return undefined;

  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    boundary === "end" ? 23 : 0,
    boundary === "end" ? 59 : 0,
    boundary === "end" ? 59 : 0,
    boundary === "end" ? 999 : 0,
  );
}

export function parseCryptoActivityDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text || ["TBA", "TBD", "N/A", "NA", "UNDEFINED", "NULL"].includes(text.toUpperCase())) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
