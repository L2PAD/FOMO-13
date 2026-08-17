export const settledValue = <T>(
  result: PromiseSettledResult<T>,
  fallback: T
): T => result.status === "fulfilled" ? result.value : fallback;

export const fulfilledValues = <T>(
  results: Array<PromiseSettledResult<T>>
): T[] => results.flatMap((result) => (
  result.status === "fulfilled" ? [result.value] : []
));

export const mergeStakeableNftTokenIds = (
  walletOwnedTokenIds: bigint[],
  reusableTokenIds: bigint[]
): bigint[] => Array.from(new Map(
  [...walletOwnedTokenIds, ...reusableTokenIds].map((tokenId) => [tokenId.toString(), tokenId])
).values());

export const hasOnlyAvailableNftSelection = (
  selectedTokenIds: bigint[],
  availableTokenIds: bigint[]
): boolean => {
  if (selectedTokenIds.length === 0) return false;
  const available = new Set(availableTokenIds.map(String));
  const selected = selectedTokenIds.map(String);
  return new Set(selected).size === selected.length
    && selected.every((tokenId) => available.has(tokenId));
};
