import { createHash } from "crypto";

type JsonLike =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLike[]
  | { [key: string]: JsonLike };

function stableStringify(value: JsonLike): string {
  if (value === null || value === undefined) return String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value !== "object") return JSON.stringify(value);

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export function cacheHash(value: JsonLike): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 20);
}

export const CacheKeys = {
  funds: {
    filters: () => "funds:filters:v1",
  },
  rounds: {
    filters: (limit: number) => `rounds:filters:v1:${cacheHash({ limit })}`,
  },
  analytics: {
    chart: (input: { entityId?: string; entityType?: string; chartType?: string | null }) =>
      `analytics:chart:v1:${cacheHash(input)}`,
    comparison: (input: { category: string; sortBy: string; limit: number }) =>
      `analytics:comparison:v1:${cacheHash(input)}`,
  },
};
