const UINT64_MAX = BigInt('18446744073709551615');

export const normalizePositiveInteger = (
  value: string,
  label: string,
  allowZero = false,
): string => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) throw new Error(`${label} must be a whole number`);
  const normalized = trimmed.replace(/^0+(?=\d)/, '');
  if (!allowZero && normalized === '0') throw new Error(`${label} must be greater than zero`);
  return normalized;
};

export const durationMinutesToSeconds = (value: string, label: string): string => {
  const minutes = BigInt(normalizePositiveInteger(value, label));
  const seconds = minutes * BigInt(60);
  if (seconds > UINT64_MAX) throw new Error(`${label} exceeds the smart-contract uint64 limit`);
  return seconds.toString();
};
