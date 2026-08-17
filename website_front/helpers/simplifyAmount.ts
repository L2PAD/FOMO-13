export const simplifyAmount = (
  value?: number | string | null,
  maxFractionDigits?: number
): string => {
  const normalizedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(String(value).replace(/[^0-9.-]/g, ""))
        : 0;

  const maxDigitsCurrent: number =
    normalizedValue < 0 && String(normalizedValue).split(".")[1]?.length > 4
      ? String(normalizedValue).split(".")[1]?.length
      : maxFractionDigits || 2;

  if (!Number.isFinite(normalizedValue) || !normalizedValue) return "0";

  const absoluteValue = Math.abs(normalizedValue);

  if (absoluteValue < 0.01) {
    const exponent = Number(absoluteValue.toExponential().split("e")[1]);
    const leadingFractionZeros = exponent < 0 ? Math.abs(exponent) - 1 : 0;
    const fractionDigits = Math.min(
      Math.max(maxDigitsCurrent, leadingFractionZeros + 3),
      8
    );
    const formattedSmallValue = normalizedValue
      .toFixed(fractionDigits)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");

    if (formattedSmallValue !== "0" && formattedSmallValue !== "-0") {
      return formattedSmallValue;
    }

    const minimumVisibleValue = `0.${"0".repeat(fractionDigits - 1)}1`;

    return normalizedValue < 0
      ? `-<${minimumVisibleValue}`
      : `<${minimumVisibleValue}`;
  }

  const formattedValue = normalizedValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: normalizedValue > 1 ? maxDigitsCurrent : 2,
  });

  const cleanedValue = formattedValue
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");

  return cleanedValue;
};
