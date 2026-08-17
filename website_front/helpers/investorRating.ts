const toFiniteNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const numberValue =
    typeof value === "number" ? value : Number(String(value).replace("%", ""));

  return Number.isFinite(numberValue) ? numberValue : null;
};

export const getInvestorRating = (investor: any): number => {
  const values = [
    investor?.rating,
    investor?.fomoScore,
    investor?.ratingBreakdown?.score,
    investor?.details?.rating,
    investor?.details?.fomoScore,
    investor?.details?.ratingBreakdown?.score,
  ];
  const numbers = values
    .map(toFiniteNumber)
    .filter((value): value is number => value !== null);
  const positiveRating = numbers.find((value) => value > 0);
  const rating = positiveRating ?? numbers[0] ?? 0;

  return Math.round(rating);
};

export const sortInvestorsByRating = <T>(investors?: readonly T[]): T[] =>
  [...(investors || [])].sort(
    (left, right) => getInvestorRating(right) - getInvestorRating(left)
  );
