const tokenIdString = (value: unknown): string => String(
  value && typeof value === "object" && "toString" in value
    ? (value as { toString: () => string }).toString()
    : value ?? ""
).trim();

export const resolveOpenedRewardTokenId = (
  originalTokenId: number,
  beforeTokenIds: unknown[],
  afterTokenIds: unknown[]
): number | undefined => {
  const before = new Set(beforeTokenIds.map(tokenIdString));
  const added = afterTokenIds.map(tokenIdString).find((tokenId) => tokenId && !before.has(tokenId));
  const candidate = added || afterTokenIds.map(tokenIdString).find((tokenId) => (
    tokenId === String(originalTokenId)
  ));
  if (!candidate || !/^(0|[1-9][0-9]*)$/.test(candidate)) return undefined;
  const parsed = Number(candidate);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

export const isMinedSuccessReceipt = (receipt: unknown): boolean => {
  if (!receipt || typeof receipt !== "object" || !("status" in receipt)) return false;
  const status = (receipt as { status?: unknown }).status;
  return status === 1 || status === "0x1";
};
