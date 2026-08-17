import { Types } from "mongoose";

export const FOMO_V2_PROJECT_DOMAIN_SOURCE_STATUSES = [
  "active",
  "locked",
  "needs_review",
  "disabled",
] as const;

export type FomoV2ProjectDomainSourceStatus =
  (typeof FOMO_V2_PROJECT_DOMAIN_SOURCE_STATUSES)[number];

export interface FomoV2ProjectDomainSourceLockInput {
  canonicalProjectId: Types.ObjectId | string;
  domain: string;
  sourceType: string;
  syncRunId?: Types.ObjectId | string;
  reason?: string;
  metadata?: Record<string, any>;
}

export type FomoV2ProjectDomainSourceLockAction =
  | "created_lock"
  | "matched_lock"
  | "source_conflict";

export interface FomoV2ProjectDomainSourceLockResult<TLock = any> {
  allowed: boolean;
  action: FomoV2ProjectDomainSourceLockAction;
  lock: TLock;
  currentSourceType?: string;
  incomingSourceType?: string;
}
