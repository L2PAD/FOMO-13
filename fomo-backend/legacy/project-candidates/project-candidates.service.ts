import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ProjectCandidate,
  ProjectCandidateEvidenceType,
  ProjectCandidateSource,
  ProjectCandidateStatus,
  ProjectCandidateSuggestedProjectType,
} from "./models/project-candidate.model";

export type ProjectCandidateInput = {
  name?: string;
  symbol?: string;
  slug?: string;
  source?: string;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  evidenceType?: string;
  evidenceEntityId?: any;
  evidenceRef?: Record<string, any>;
  suggestedProjectType?: string;
  status?: string;
  confidence?: number;
  matchedBy?: string;
  reason?: string;
  matchedProjectId?: any;
  createdProjectId?: any;
  canonicalProjectId?: any;
  rawEvidence?: any;
  dataQuality?: ProjectCandidate["dataQuality"];
};

export type ProjectCandidateWriteOptions = {
  dryRun?: boolean;
  dryRunCache?: Map<string, any>;
};

@Injectable()
export class ProjectCandidateService {
  private readonly candidateLocks = new Map<string, Promise<any>>();

  constructor(
    @InjectModel(ProjectCandidate.name)
    private readonly projectCandidateModel: Model<ProjectCandidate>,
  ) {}

  normalizeCandidate(input: ProjectCandidateInput) {
    const evidenceType = this.evidenceType(input.evidenceType);
    const evidenceEntityId = this.toObjectId(input.evidenceEntityId);
    const normalizedSlug = this.normalizeSlug(input.slug || input.sourceSlug);
    const normalizedName = this.normalizeName(input.name);
    const normalizedSymbol = this.normalizeSymbol(input.symbol);
    const evidenceRef = this.evidenceRef(input, evidenceType, evidenceEntityId);

    return {
      name: this.optionalString(input.name),
      normalizedName,
      symbol: this.optionalString(input.symbol),
      normalizedSymbol,
      slug: normalizedSlug || this.optionalString(input.slug),
      normalizedSlug,
      source: this.source(input.source),
      sourceId: this.optionalString(input.sourceId),
      sourceSlug: this.optionalString(input.sourceSlug || input.slug),
      sourceUrl: this.optionalString(input.sourceUrl),
      evidenceType,
      evidenceEntityId,
      evidenceRefs: evidenceRef ? [evidenceRef] : [],
      suggestedProjectType: this.suggestedProjectType(input.suggestedProjectType),
      status: this.status(input.status),
      confidence: this.confidence(input.confidence),
      matchedBy: this.optionalString(input.matchedBy),
      reason: this.optionalString(input.reason),
      matchedProjectId: this.toObjectId(input.matchedProjectId),
      createdProjectId: this.toObjectId(input.createdProjectId),
      canonicalProjectId: this.toObjectId(input.canonicalProjectId),
      rawEvidence: input.rawEvidence,
      dataQuality: this.dataQuality(input),
    };
  }

  async findExistingCandidate(input: ProjectCandidateInput) {
    const payload = this.normalizeCandidate(input);
    const queries = this.idempotencyQueries(payload);

    for (const query of queries) {
      const existing = await this.projectCandidateModel.findOne(query).lean();
      if (existing) return existing;
    }

    return null;
  }

  async proposeCandidate(input: ProjectCandidateInput, options: ProjectCandidateWriteOptions = {}) {
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
        const candidate = await this.mergeEvidence(existing._id, payload.evidenceRefs?.[0], { dryRun: false }, payload);
        return { status: "mergedEvidence", candidate, mergedEvidence: true };
      }

      const created = await this.projectCandidateModel.create(payload);
      return {
        status: "created",
        candidate: typeof (created as any).toObject === "function" ? (created as any).toObject() : created,
        created: true,
      };
    });
  }

  async mergeEvidence(candidateId: any, evidence: any, options: ProjectCandidateWriteOptions = {}, normalizedPayload?: any) {
    const objectId = this.toObjectId(candidateId);
    if (!objectId) return null;
    if (options.dryRun) return { _id: objectId, __dryRun: true };

    const set: Record<string, any> = {
      updatedAt: new Date(),
    };
    const max: Record<string, any> = {};
    const addToSet: Record<string, any> = {};

    if (evidence) addToSet.evidenceRefs = evidence;
    if (normalizedPayload?.dataQuality?.warnings?.length) {
      addToSet["dataQuality.warnings"] = { $each: normalizedPayload.dataQuality.warnings };
    }
    if (normalizedPayload?.confidence !== undefined) max.confidence = normalizedPayload.confidence;
    for (const [key, value] of Object.entries(normalizedPayload?.dataQuality || {})) {
      if (key === "warnings" || value !== true) continue;
      set[`dataQuality.${key}`] = true;
    }

    return this.projectCandidateModel
      .findByIdAndUpdate(
        objectId,
        {
          ...(Object.keys(set).length ? { $set: set } : {}),
          ...(Object.keys(max).length ? { $max: max } : {}),
          ...(Object.keys(addToSet).length ? { $addToSet: addToSet } : {}),
        },
        { new: true },
      )
      .lean();
  }

  async markMatchedExistingProject(candidateId: any, projectId: any, options: ProjectCandidateWriteOptions = {}) {
    return this.markProjectState(candidateId, {
      matchedProjectId: this.toObjectId(projectId),
      status: "matched_existing_project",
    }, options);
  }

  async markCreatedProject(candidateId: any, projectId: any, canonicalProjectId: any, options: ProjectCandidateWriteOptions = {}) {
    return this.markProjectState(candidateId, {
      createdProjectId: this.toObjectId(projectId),
      canonicalProjectId: this.toObjectId(canonicalProjectId),
      status: "created_project",
    }, options);
  }

  async rejectCandidate(candidateId: any, reason: string, options: ProjectCandidateWriteOptions = {}) {
    return this.markProjectState(candidateId, {
      status: "rejected",
      reason: this.cleanString(reason),
    }, options);
  }

  async getCoverageStats() {
    const [total, byEvidenceType, byStatus, conflicts, unsafe] = await Promise.all([
      this.projectCandidateModel.countDocuments({}),
      this.projectCandidateModel.aggregate([{ $group: { _id: "$evidenceType", count: { $sum: 1 } } }]),
      this.projectCandidateModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      this.projectCandidateModel.countDocuments({ status: "conflict" }),
      this.projectCandidateModel.countDocuments({ "dataQuality.warnings": /symbol-only unsafe/i }),
    ]);

    return {
      projectCandidates: total,
      conflicts,
      unsafe,
      byEvidenceType: Object.fromEntries((byEvidenceType as any[]).map((row) => [row._id || "unknown", row.count])),
      byStatus: Object.fromEntries((byStatus as any[]).map((row) => [row._id || "unknown", row.count])),
    };
  }

  async getCandidatesForEvidence(entityType: string, entityId: string) {
    const evidenceType = this.evidenceType(entityType);
    const objectId = this.toObjectId(entityId);
    const query: any = { evidenceType };
    if (objectId) query.evidenceEntityId = objectId;
    return this.projectCandidateModel.find(query).sort({ confidence: -1, updatedAt: -1 }).limit(100).lean();
  }

  async listCandidates(query: { status?: string; evidenceType?: string; limit?: number } = {}) {
    const filter: any = {};
    if (query.status) filter.status = this.status(query.status);
    if (query.evidenceType) filter.evidenceType = this.evidenceType(query.evidenceType);
    return this.projectCandidateModel
      .find(filter)
      .sort({ updatedAt: -1, confidence: -1 })
      .limit(this.limit(query.limit))
      .lean();
  }

  async getCandidate(candidateId: string) {
    const objectId = this.toObjectId(candidateId);
    if (!objectId) return null;
    return this.projectCandidateModel.findById(objectId).lean();
  }

  async getConflicts(limit = 100) {
    return this.projectCandidateModel
      .find({ status: "conflict" })
      .sort({ updatedAt: -1, confidence: -1 })
      .limit(this.limit(limit))
      .lean();
  }

  private async markProjectState(candidateId: any, set: Record<string, any>, options: ProjectCandidateWriteOptions) {
    const objectId = this.toObjectId(candidateId);
    if (!objectId) return null;
    if (options.dryRun) return { _id: objectId, ...set, __dryRun: true };
    return this.projectCandidateModel.findByIdAndUpdate(objectId, { $set: set }, { new: true }).lean();
  }

  private evidenceRef(input: ProjectCandidateInput, evidenceType: ProjectCandidateEvidenceType, evidenceEntityId?: Types.ObjectId) {
    if (!evidenceType && !evidenceEntityId) return null;
    return {
      entityType: evidenceType,
      entityId: evidenceEntityId,
      source: this.source(input.source),
      sourceId: this.optionalString(input.sourceId),
      sourceSlug: this.optionalString(input.sourceSlug || input.slug),
      sourceUrl: this.optionalString(input.sourceUrl),
      confidence: this.confidence(input.confidence),
      matchedBy: this.optionalString(input.matchedBy),
      reason: this.optionalString(input.reason),
      raw: input.evidenceRef?.raw,
    };
  }

  private dataQuality(input: ProjectCandidateInput) {
    const evidenceType = this.evidenceType(input.evidenceType);
    const warnings = Array.from(new Set((input.dataQuality?.warnings || []).map((item) => this.cleanString(item)).filter(Boolean)));
    return {
      hasFundingRounds: input.dataQuality?.hasFundingRounds || evidenceType === "fundingRound",
      hasUnlocks: input.dataQuality?.hasUnlocks || evidenceType === "tokenUnlock",
      hasActivities: input.dataQuality?.hasActivities || evidenceType === "cryptoActivity",
      hasProviderId: Boolean(input.dataQuality?.hasProviderId),
      hasSourceUrl: Boolean(input.dataQuality?.hasSourceUrl || input.sourceUrl),
      warnings,
    };
  }

  private mergePayload(existing: any, payload: any) {
    return {
      ...existing,
      confidence: Math.max(Number(existing.confidence || 0), Number(payload.confidence || 0)),
      dataQuality: {
        ...(existing.dataQuality || {}),
        ...Object.fromEntries(Object.entries(payload.dataQuality || {}).filter(([, value]) => value === true)),
        warnings: Array.from(new Set([...(existing.dataQuality?.warnings || []), ...(payload.dataQuality?.warnings || [])])),
      },
      evidenceRefs: this.mergeEvidenceRefs(existing.evidenceRefs || [], payload.evidenceRefs || []),
    };
  }

  private idempotencyQueries(payload: any): any[] {
    const queries: any[] = [];
    const push = (query: any) => {
      const key = JSON.stringify(query);
      if (!queries.some((candidate) => JSON.stringify(candidate) === key)) queries.push(query);
    };

    if (payload.normalizedSlug) {
      push({
        normalizedSlug: payload.normalizedSlug,
      });
    }
    if (payload.sourceSlug && payload.source && payload.source !== "unknown") {
      push({
        source: payload.source,
        sourceSlug: payload.sourceSlug,
      });
    }
    if (payload.normalizedSlug && payload.normalizedName) {
      push({
        normalizedSlug: payload.normalizedSlug,
        normalizedName: payload.normalizedName,
      });
    }
    if (payload.normalizedSlug && payload.normalizedSymbol) {
      push({
        normalizedSlug: payload.normalizedSlug,
        normalizedSymbol: payload.normalizedSymbol,
      });
    }
    if (payload.normalizedName && payload.normalizedSymbol) {
      push({
        normalizedName: payload.normalizedName,
        normalizedSymbol: payload.normalizedSymbol,
      });
    }
    if (payload.sourceId) {
      push({
        source: payload.source,
        sourceId: payload.sourceId,
      });
    }
    if (payload.evidenceEntityId && payload.normalizedSlug) {
      push({
        evidenceType: payload.evidenceType,
        evidenceEntityId: payload.evidenceEntityId,
        normalizedSlug: payload.normalizedSlug,
      });
    }
    return queries;
  }

  private cacheKey(payload: any): string {
    const projectIdentityKey = this.projectIdentityKeys(payload)[0];
    if (projectIdentityKey) return `projectCandidate:${projectIdentityKey}`;
    const entityKey =
      payload.evidenceEntityId && payload.normalizedSlug
        ? `${payload.evidenceType}:${payload.evidenceEntityId}:${payload.normalizedSlug}`
        : "";
    return `projectCandidate:${entityKey || new Types.ObjectId().toString()}`;
  }

  private projectIdentityKeys(payload: any): string[] {
    const keys: string[] = [];
    if (payload.normalizedSlug) {
      keys.push(`slug:${payload.normalizedSlug}`);
    }
    if (payload.sourceSlug && payload.source && payload.source !== "unknown") {
      keys.push(`source-slug:${payload.source}:${payload.sourceSlug}`);
    }
    if (payload.normalizedSlug && payload.normalizedName) {
      keys.push(`slug-name:${payload.normalizedSlug}:${payload.normalizedName}`);
    }
    if (payload.normalizedSlug && payload.normalizedSymbol) {
      keys.push(`slug-symbol:${payload.normalizedSlug}:${payload.normalizedSymbol}`);
    }
    if (payload.normalizedName && payload.normalizedSymbol) {
      keys.push(`name-symbol:${payload.normalizedName}:${payload.normalizedSymbol}`);
    }
    if (payload.sourceId) {
      keys.push(`source-id:${payload.source}:${payload.sourceId}`);
    }
    return keys;
  }

  private mergeEvidenceRefs(existingRefs: any[], incomingRefs: any[]) {
    const byKey = new Map<string, any>();
    for (const ref of [...existingRefs, ...incomingRefs]) {
      const key = [
        ref?.entityType || "",
        ref?.entityId?.toString?.() || "",
        ref?.source || "",
        ref?.sourceId || "",
        ref?.sourceSlug || "",
      ].join("|");
      byKey.set(key || new Types.ObjectId().toString(), ref);
    }
    return Array.from(byKey.values());
  }

  private async withCandidateLock<T>(key: string, handler: () => Promise<T>): Promise<T> {
    const previous = this.candidateLocks.get(key) || Promise.resolve();
    const current = previous.catch(() => undefined).then(handler);
    this.candidateLocks.set(key, current);
    try {
      return await current;
    } finally {
      if (this.candidateLocks.get(key) === current) this.candidateLocks.delete(key);
    }
  }

  private source(value: any): ProjectCandidateSource {
    const normalized = this.cleanString(value).toLowerCase().replace(/[-\s]+/g, "_");
    if (["dropstab", "icodrops", "coinmarketcap", "coingecko", "cryptorank", "intel_unlocks", "crypto_activity"].includes(normalized)) {
      return normalized as ProjectCandidateSource;
    }
    return "unknown";
  }

  private evidenceType(value: any): ProjectCandidateEvidenceType {
    const normalized = this.cleanString(value).replace(/[-_\s]+/g, "").toLowerCase();
    const map: Record<string, ProjectCandidateEvidenceType> = {
      fundinground: "fundingRound",
      fundingrounds: "fundingRound",
      tokenunlock: "tokenUnlock",
      tokenunlocks: "tokenUnlock",
      cryptoactivity: "cryptoActivity",
      cryptoactivities: "cryptoActivity",
      investorportfolio: "investorPortfolio",
      projectintel: "projectIntel",
      projectunlocks: "projectUnlocks",
    };
    return map[normalized] || "unknown";
  }

  private suggestedProjectType(value: any): ProjectCandidateSuggestedProjectType {
    const normalized = this.cleanString(value).toLowerCase();
    if (normalized === "project" || normalized === "market") return normalized;
    return "unknown";
  }

  private status(value: any): ProjectCandidateStatus {
    const normalized = this.cleanString(value).toLowerCase();
    if (
      [
        "new",
        "matched_existing_project",
        "ready_to_create_project",
        "created_project",
        "rejected",
        "duplicate",
        "conflict",
      ].includes(normalized)
    ) {
      return normalized as ProjectCandidateStatus;
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
    return Math.min(Math.trunc(parsed), 500);
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return undefined;
  }

  private cleanString(value: any): string {
    return String(value || "").trim();
  }

  private optionalString(value: any): string | undefined {
    const cleaned = this.cleanString(value);
    return cleaned || undefined;
  }

  private normalizeName(value: any): string {
    return this.cleanString(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSymbol(value: any): string {
    return this.cleanString(value).replace(/^\$/, "").toUpperCase();
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
