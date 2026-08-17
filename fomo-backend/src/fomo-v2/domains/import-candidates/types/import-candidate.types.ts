import { Types } from "mongoose";

export const FOMO_V2_IMPORT_CANDIDATE_STATUSES = [
  "open",
  "resolved",
  "ignored",
  "superseded",
] as const;

export type FomoV2ImportCandidateStatus =
  (typeof FOMO_V2_IMPORT_CANDIDATE_STATUSES)[number];

export interface FomoV2ImportCandidateInput {
  domain: string;
  entityType: string;
  sourceType: string;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  sourcePath?: string;
  name?: string;
  symbol?: string;
  slug?: string;
  normalizedName?: string;
  normalizedSymbol?: string;
  normalizedSlug?: string;
  payload?: Record<string, any>;
  normalizedPayload?: Record<string, any>;
  candidateFingerprint?: string;
  status?: FomoV2ImportCandidateStatus;
  syncRunId?: Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export interface FomoV2ImportCandidateUpsertResult<TCandidate = any> {
  candidate: TCandidate;
  created: boolean;
  candidateFingerprint: string;
}
