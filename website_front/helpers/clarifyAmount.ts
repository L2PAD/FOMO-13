export const clarifyAmount = (
  amount: number | string | null | undefined,
  isRounded?: boolean,
  rightSymbol?: string,
  precisionIfSmall?: number,
  leftSymbol?: string
): string | number => {
  const normalizedAmount =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
        ? Number(String(amount).replace(/[^0-9.-]/g, ""))
        : 0;

  if (!Number.isFinite(normalizedAmount) || !normalizedAmount) return 0;

  const getFixed = (num: number) => {
    if (normalizedAmount % num === 0) {
      return normalizedAmount / num;
    } else {
      return (normalizedAmount / num).toFixed(1);
    }
  };

  if (normalizedAmount < 1) {
    const precision = precisionIfSmall ?? (() => {
      if (normalizedAmount === 0) return 0;

      const strAmount = normalizedAmount.toString();

      if (strAmount.includes('e')) {
        return 8;
      }

      const match = strAmount.match(/^0\.0*[1-9]/);
      if (match) {
        const zerosAfterDot = (match[0].match(/0/g) || []).length - 1; // -1 для нуля перед точкой
        return Math.min(zerosAfterDot + 4, 8);
      }

      return 2;
    })();

    const formattedAmount = normalizedAmount.toFixed(precision).replace(/\.?0+$/, '');
    return `${leftSymbol || ""}${formattedAmount}${rightSymbol ?? ""}`;
  }
  if (1000000000 === normalizedAmount) return `1B`;

  if (normalizedAmount < 1_000_000) {
    const roundedValue = Math.floor(normalizedAmount);
    const formattedValue = roundedValue.toLocaleString("en-US");

    return `${formattedValue}${rightSymbol ?? ""}`;
  } else if (normalizedAmount < 1_000_000_000) {
    const value = String(getFixed(1_000_000)).replace(
      /(\d)(?=(\d\d\d)+([^\d]|$))/g,
      "$1."
    );
    return `${value.split(".")[0]}M`;
  } else {
    const value = String(getFixed(1_000_000_000)).replace(
      /(\d)(?=(\d\d\d)+([^\d]|$))/g,
      "$1."
    );
    return isRounded ? `${value.split(".")[0]}B` : `${value}B`;
  }
};
