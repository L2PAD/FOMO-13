import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  InvestorCandidate,
  InvestorCandidateEvidenceType,
  InvestorCandidateStatus,
  InvestorCandidateType,
} from "./models/investor-candidate.model";

export type InvestorCandidateInput = {
  name?: string;
  slug?: string;
  source?: string;
  sourceInvestorId?: string;
  sourceInvestorSlug?: string;
  sourceUrl?: string;
  candidateType?: string;
  evidenceType?: string;
  evidenceEntityId?: any;
  fundingRoundId?: any;
  canonicalProjectId?: any;
  role?: string;
  status?: string;
  confidence?: number;
  matchedBy?: string;
  reason?: string;
  matchedFundId?: any;
  matchedPersonId?: any;
  createdFundId?: any;
  createdPersonId?: any;
  rawEvidence?: any;
  raw?: any;
  dataQuality?: InvestorCandidate["dataQuality"];
};

export type InvestorCandidateWriteOptions = {
  dryRun?: boolean;
  dryRunCache?: Map<string, any>;
};

@Injectable()
export class InvestorCandidateService {
  private readonly candidateLocks = new Map<string, Promise<any>>();

  constructor(
    @InjectModel(InvestorCandidate.name)
    private readonly investorCandidateModel: Model<InvestorCandidate>,
  ) {}

  normalizeCandidate(input: InvestorCandidateInput) {
    const normalizedName = this.normalizeName(input.name);
    const normalizedSlug = this.normalizeSlug(input.slug || input.sourceInvestorSlug);
    const evidenceType = this.evidenceType(input.evidenceType);
    const evidenceEntityId = this.toObjectId(input.evidenceEntityId);
    const fundingRoundId = this.toObjectId(input.fundingRoundId || input.evidenceEntityId);
    const canonicalProjectId = this.toObjectId(input.canonicalProjectId);
    const sourceInvestorSlug = normalizedSlug || this.optionalString(input.sourceInvestorSlug || input.slug);
    const evidenceRef = {
      entityType: evidenceType,
      entityId: evidenceEntityId,
      fundingRoundId,
      canonicalProjectId,
      source: this.optionalString(input.source),
      sourceInvestorId: this.optionalString(input.sourceInvestorId),
      sourceInvestorSlug,
      sourceInvestorName: this.optionalString(input.name),
      role: this.optionalString(input.role),
      raw: input.raw ?? input.rawEvidence,
    };

    return {
      name: this.optionalString(input.name),
      normalizedName,
      slug: sourceInvestorSlug,
      normalizedSlug,
      source: this.optionalString(input.source),
      sourceInvestorId: this.optionalString(input.sourceInvestorId),
      sourceInvestorSlug,
      sourceUrl: this.optionalString(input.sourceUrl),
      candidateType: this.candidateType(input.candidateType),
      evidenceType,
      evidenceEntityId,
      evidenceRefs: [evidenceRef],
      status: this.status(input.status),
      confidence: this.confidence(input.confidence),
      matchedBy: this.optionalString(input.matchedBy),
      reason: this.optionalString(input.reason),
      matchedFundId: this.toObjectId(input.matchedFundId),
      matchedPersonId: this.toObjectId(input.matchedPersonId),
      createdFundId: this.toObjectId(input.createdFundId),
      createdPersonId: this.toObjectId(input.createdPersonId),
      rawEvidence: input.rawEvidence,
      dataQuality: this.dataQuality(input, sourceInvestorSlug),
    };
  }

  async findExistingCandidate(input: InvestorCandidateInput) {
    const payload = this.normalizeCandidate(input);
    for (const query of this.idempotencyQueries(payload)) {
      const existing = await this.investorCandidateModel.findOne(query).lean();
      if (existing) return existing;
    }
    return null;
  }

  async proposeCandidate(input: InvestorCandidateInput, options: InvestorCandidateWriteOptions = {}) {
    const payload = this.normalizeCandidate(input);
    const cacheKey = this.cacheKey(payload);
    return this.withCandidateLock(cacheKey, async () => {
      if (options.dryRun) {
        const existing = options.dryRunCache?.get(cacheKey);
        if (existing) {
          const merged = this.mergePayload(existing, payload);
          options.dryRunCache?.set(cacheKey, merged);
          return { status: "mergedEvidence", candidate: merged, wouldMergeEvidence: true, dryRun: true };
        }

        const candidate = { _id: new Types.ObjectId(), ...payload, __dryRun: true };
        options.dryRunCache?.set(cacheKey, candidate);
        return { status: "created", candidate, wouldCreate: true, dryRun: true };
      }

      const existing = await this.findExistingCandidate(payload);
      if (existing?._id) {
        const candidate = await this.mergeEvidence(existing._id, payload.evidenceRefs?.[0], payload);
        return { status: "mergedEvidence", candidate, mergedEvidence: true };
      }

      const created = await this.investorCandidateModel.create(payload);
      const candidate = typeof (created as any).toObject === "function" ? (created as any).toObject() : created;
      return { status: "created", candidate, created: true };
    });
  }

  async mergeEvidence(candidateId: any, evidence: any, normalizedPayload?: any) {
    const objectId = this.toObjectId(candidateId);
    if (!objectId) return null;

    const set: Record<string, any> = { updatedAt: new Date() };
    const addToSet: Record<string, any> = {};
    const max: Record<string, any> = {};
    if (evidence) addToSet.evidenceRefs = evidence;
    if (normalizedPayload?.dataQuality?.warnings?.length) {
      addToSet["dataQuality.warnings"] = { $each: normalizedPayload.dataQuality.warnings };
    }
    if (normalizedPayload?.confidence !== undefined) max.confidence = normalizedPayload.confidence;
    for (const [key, value] of Object.entries(normalizedPayload?.dataQuality || {})) {
      if (key === "warnings" || value !== true) continue;
      set[`dataQuality.${key}`] = true;
    }

    return this.investorCandidateModel
      .findByIdAndUpdate(
        objectId,
        {
          ...(Object.keys(set).length ? { $set: set } : {}),
          ...(Object.keys(addToSet).length ? { $addToSet: addToSet } : {}),
          ...(Object.keys(max).length ? { $max: max } : {}),
        },
        { new: true },
      )
      .lean();
  }

  async getCoverageStats() {
    const [total, byStatus, byEvidenceType, byCandidateType] = await Promise.all([
      this.investorCandidateModel.countDocuments({}),
      this.investorCandidateModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      this.investorCandidateModel.aggregate([{ $group: { _id: "$evidenceType", count: { $sum: 1 } } }]),
      this.investorCandidateModel.aggregate([{ $group: { _id: "$candidateType", count: { $sum: 1 } } }]),
    ]);

    return {
      investorCandidates: total,
      byStatus: this.rowsToObject(byStatus as any[]),
      byEvidenceType: this.rowsToObject(byEvidenceType as any[]),
      byCandidateType: this.rowsToObject(byCandidateType as any[]),
    };
  }

  async listCandidates(query: { status?: string; evidenceType?: string; limit?: number } = {}) {
    const filter: any = {};
    if (query.status) filter.status = this.status(query.status);
    if (query.evidenceType) filter.evidenceType = this.evidenceType(query.evidenceType);
    return this.investorCandidateModel.find(filter).sort({ updatedAt: -1, confidence: -1 }).limit(this.limit(query.limit)).lean();
  }

  async getCandidate(candidateId: string) {
    const objectId = this.toObjectId(candidateId);
    if (!objectId) return null;
    return this.investorCandidateModel.findById(objectId).lean();
  }

  async getCandidatesForEvidence(entityType: string, entityId: string) {
    const objectId = this.toObjectId(entityId);
    const query: any = { evidenceType: this.evidenceType(entityType) };
    if (objectId) query.evidenceEntityId = objectId;
    return this.investorCandidateModel.find(query).sort({ confidence: -1, updatedAt: -1 }).limit(100).lean();
  }

  async getConflicts(limit = 100) {
    return this.investorCandidateModel
      .find({ status: "conflict" })
      .sort({ updatedAt: -1, confidence: -1 })
      .limit(this.limit(limit))
      .lean();
  }

  private async withCandidateLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.candidateLocks.get(key) || Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = previous.then(() => current, () => current);
    this.candidateLocks.set(key, chained);

    try {
      await previous.catch(() => undefined);
      return await operation();
    } finally {
      release();
      if (this.candidateLocks.get(key) === chained) this.candidateLocks.delete(key);
    }
  }

  private dataQuality(input: InvestorCandidateInput, slug?: string) {
    return {
      hasSourceId: Boolean(input.dataQuality?.hasSourceId || input.sourceInvestorId),
      hasSlug: Boolean(input.dataQuality?.hasSlug || slug),
      hasWebsite: Boolean(input.dataQuality?.hasWebsite),
      hasSocials: Boolean(input.dataQuality?.hasSocials),
      warnings: Array.from(new Set((input.dataQuality?.warnings || []).map((item) => this.cleanString(item)).filter(Boolean))),
    };
  }

  private idempotencyQueries(payload: any) {
    const queries: any[] = [];
    if (payload.sourceInvestorId) queries.push({ source: payload.source, sourceInvestorId: payload.sourceInvestorId });
    if (payload.sourceInvestorSlug) queries.push({ source: payload.source, sourceInvestorSlug: payload.sourceInvestorSlug });
    if (!queries.length && payload.normalizedName) queries.push({ normalizedName: payload.normalizedName });
    return queries;
  }

  private cacheKey(payload: any): string {
    if (payload.sourceInvestorId) return `sourceId:${payload.source || "unknown"}:${payload.sourceInvestorId}`;
    if (payload.sourceInvestorSlug) return `sourceSlug:${payload.source || "unknown"}:${payload.sourceInvestorSlug}`;
    if (payload.normalizedName) return `name:${payload.normalizedName}`;
    return `candidate:${new Types.ObjectId().toString()}`;
  }

  private mergePayload(existing: any, payload: any) {
    return {
      ...existing,
      confidence: Math.max(Number(existing.confidence || 0), Number(payload.confidence || 0)),
      evidenceRefs: [...(existing.evidenceRefs || []), ...(payload.evidenceRefs || [])],
      dataQuality: {
        ...(existing.dataQuality || {}),
        ...Object.fromEntries(Object.entries(payload.dataQuality || {}).filter(([, value]) => value === true)),
        warnings: Array.from(new Set([...(existing.dataQuality?.warnings || []), ...(payload.dataQuality?.warnings || [])])),
      },
    };
  }

  private rowsToObject(rows: any[]) {
    return Object.fromEntries((rows || []).map((row) => [row._id || "unknown", row.count]));
  }

  private candidateType(value: any): InvestorCandidateType {
    const normalized = this.cleanString(value).toLowerCase();
    if (normalized === "fund" || normalized === "person") return normalized;
    return "unknown";
  }

  private evidenceType(value: any): InvestorCandidateEvidenceType {
    const normalized = this.cleanString(value).replace(/[-_\s]+/g, "").toLowerCase();
    const map: Record<string, InvestorCandidateEvidenceType> = {
      fundinground: "fundingRound",
      fundingrounds: "fundingRound",
      fundportfolio: "fundPortfolio",
      personportfolio: "personPortfolio",
      investorparser: "investorParser",
    };
    return map[normalized] || "unknown";
  }

  private status(value: any): InvestorCandidateStatus {
    const normalized = this.cleanString(value).toLowerCase();
    if (
      [
        "new",
        "matched_existing_fund",
        "matched_existing_person",
        "ready_to_create_fund",
        "ready_to_create_person",
        "created_fund",
        "created_person",
        "duplicate",
        "rejected",
        "conflict",
      ].includes(normalized)
    ) {
      return normalized as InvestorCandidateStatus;
    }
    return "new";
  }

  private confidence(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(100, Math.max(0, Math.trunc(parsed)));
  }

  private limit(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 100;
    return Math.min(500, Math.trunc(parsed));
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return undefined;
  }

  private optionalString(value: any): string | undefined {
    const cleaned = this.cleanString(value);
    return cleaned || undefined;
  }

  private cleanString(value: any): string {
    return String(value || "").trim();
  }

  private normalizeName(value: any): string {
    return this.cleanString(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSlug(value: any): string {
    return this.cleanString(value)
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/^https?:\/\/[^/]+\/?/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
