import { ConflictException } from "@nestjs/common";
import { Types } from "mongoose";

export type FomoV2ActivityIdentityFetcher<T> = (
  match: Record<string, any>,
  limit: 1 | 2
) => Promise<T[]>;

/**
 * Resolves globally stable identities first. `parserActivityId` is only a
 * compatibility lookup and can be shared by multiple providers, so it must be
 * read with an ambiguity guard after the unique identities miss.
 */
export async function resolveActivityByIdentity<T extends Record<string, any>>(
  idOrSlug: string,
  fetch: FomoV2ActivityIdentityFetcher<T>,
  options: { slugField?: string; decodeUri?: boolean } = {}
): Promise<T | undefined> {
  const value = activityIdentityValue(idOrSlug, options.decodeUri);
  const stable = await fetch(
    stableActivityIdentityMatch(value, options.slugField),
    1
  );
  if (stable[0]) return stable[0];

  const parserMatches = await fetch({ parserActivityId: value }, 2);
  if (parserMatches.length > 1) {
    throw new ConflictException({
      message:
        "parserActivityId matches multiple provider-scoped activities. Use the activity ObjectId or slug.",
      code: "AMBIGUOUS_ACTIVITY_PARSER_ID",
      parserActivityId: value,
      candidateActivityIds: parserMatches
        .map((activity) => String(activity?._id || ""))
        .filter(Boolean),
      action: "use_object_id_or_slug",
    });
  }
  return parserMatches[0];
}

export function stableActivityIdentityMatch(
  value: string,
  slugField = "slug"
): Record<string, any> {
  const or: Record<string, any>[] = [
    { [slugField]: value.toLowerCase() },
    { legacyActivityId: value },
  ];
  if (/^\d+$/.test(value)) or.push({ legacyNumericId: Number(value) });
  if (Types.ObjectId.isValid(value)) {
    or.push({ _id: new Types.ObjectId(value) });
  }
  return { $or: or };
}

function activityIdentityValue(value: string, decodeUri = false): string {
  let normalized = String(value || "").trim();
  if (decodeUri) {
    try {
      normalized = decodeURIComponent(normalized);
    } catch (_error) {
      // A malformed URI remains a literal lookup value.
    }
  }
  return normalized;
}
