import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CanonicalProjectLinkService } from "src/canonical-projects/services/canonical-project-link.service";
import { FundingRound } from "src/funding-rounds/models/funding-round.model";
import { Funds } from "src/funds/funds.model";
import { Person } from "src/persons/person.model";
import {
  FundingRoundParticipantAllocationMethod,
  FundingRoundParticipantMatchStatus,
  FundingRoundParticipantRole,
  FundingRoundParticipantType,
} from "../models/funding-round-participant.model";

export type FundingRoundParticipantCandidate = {
  type: "fund" | "person";
  id: Types.ObjectId;
  name?: string;
  slug?: string;
  matchedBy: string;
  confidence: number;
};

export type FundingRoundParticipantResolution = {
  fundingRoundId: Types.ObjectId;
  canonicalProjectId?: Types.ObjectId | null;
  legacyProjectId?: Types.ObjectId | null;
  participantType: FundingRoundParticipantType;
  fundId?: Types.ObjectId | null;
  personId?: Types.ObjectId | null;
  investorCandidateId?: Types.ObjectId | null;
  role: FundingRoundParticipantRole;
  source?: string;
  sourceInvestorId?: string;
  sourceInvestorSlug?: string;
  sourceInvestorName?: string;
  amountUsd?: number;
  allocationMethod: FundingRoundParticipantAllocationMethod;
  confidence: number;
  matchedBy: string;
  reason: string;
  matchStatus: FundingRoundParticipantMatchStatus;
  rawInvestor?: any;
  candidates?: FundingRoundParticipantCandidate[];
};

export type FundingRoundParticipantRoundResolution = {
  roundId: Types.ObjectId;
  canonicalProjectId?: Types.ObjectId | null;
  rawInvestorsScanned: number;
  participants: FundingRoundParticipantResolution[];
};

export type FundingRoundParticipantResolverBatchCache = {
  fundsByDropstabId: Map<string, any[]>;
  personsByDropstabId: Map<string, any[]>;
  fundsBySourceId: Map<string, any[]>;
  personsBySourceId: Map<string, any[]>;
  fundsBySlug: Map<string, any[]>;
  personsBySlug: Map<string, any[]>;
  fundsByName: Map<string, any[]>;
  personsByName: Map<string, any[]>;
};

@Injectable()
export class FundingRoundParticipantResolverService {
  private readonly investorResolutionCache = new Map<string, Promise<FundingRoundParticipantResolution>>();

  constructor(
    @InjectModel(Funds.name) private readonly fundsModel: Model<Funds>,
    @InjectModel(Person.name) private readonly personModel: Model<Person>,
    private readonly canonicalProjectLinkService: CanonicalProjectLinkService,
  ) {}

  async buildBatchCache(rounds: Array<FundingRound & { _id?: any }>): Promise<FundingRoundParticipantResolverBatchCache | undefined> {
    this.investorResolutionCache.clear();
    const inputs: NormalizedParticipantInvestorInput[] = [];
    for (const round of rounds || []) {
      for (const rawInvestor of this.mergeRoundInvestors(round)) {
        inputs.push(this.normalizeInvestorInput(rawInvestor, round));
      }
    }
    if (!inputs.length) return undefined;

    const values = this.collectBatchValues(inputs);
    const or = this.batchLookupOr(values);
    if (!or.length) return undefined;

    const [funds, persons] = await Promise.all([
      this.fundsModel.find({ $or: or }).select(this.investorProjection()).lean(),
      this.personModel.find({ $or: or }).select(this.investorProjection()).lean(),
    ]);

    return this.indexBatchCandidates(funds as any[], persons as any[]);
  }

  async resolveRound(
    round: FundingRound & { _id?: any },
    batchCache?: FundingRoundParticipantResolverBatchCache,
  ): Promise<FundingRoundParticipantRoundResolution> {
    const fundingRoundId = this.toObjectId(round?._id);
    if (!fundingRoundId) {
      return { roundId: null, canonicalProjectId: null, rawInvestorsScanned: 0, participants: [] };
    }

    const canonicalResolution = await this.canonicalProjectLinkService.resolveCanonicalForEntity("fundingRound", fundingRoundId);
    const canonicalProjectId = this.toObjectId(canonicalResolution?.canonicalProjectId);
    const rawInvestors = this.mergeRoundInvestors(round);
    const amountPlan = this.estimateAllocations(rawInvestors, this.toNumber((round as any)?.fundsRaised));

    const participants: FundingRoundParticipantResolution[] = [];
    for (const rawInvestor of rawInvestors) {
      const investorResolution = await this.resolveInvestor(rawInvestor, round, batchCache);
      const amount = amountPlan.get(rawInvestor.__key);
      const matchStatus = this.finalMatchStatus(investorResolution.matchStatus, canonicalProjectId);
      participants.push({
        fundingRoundId,
        canonicalProjectId,
        legacyProjectId: this.legacyProjectId(round),
        participantType: investorResolution.participantType,
        fundId: investorResolution.fundId,
        personId: investorResolution.personId,
        role: rawInvestor.__role,
        source: this.roundSource(round, rawInvestor),
        sourceInvestorId: this.cleanIdentifier(rawInvestor.id ?? rawInvestor.sourceInvestorId ?? rawInvestor.sourceId),
        sourceInvestorSlug: this.normalizeSlug(rawInvestor.investorSlug ?? rawInvestor.slug ?? rawInvestor.sourceInvestorSlug),
        sourceInvestorName: this.cleanText(rawInvestor.name ?? rawInvestor.sourceInvestorName),
        amountUsd: amount?.amountUsd,
        allocationMethod: amount?.allocationMethod || "unknown",
        confidence: investorResolution.confidence,
        matchedBy: investorResolution.matchedBy,
        reason:
          !canonicalProjectId && investorResolution.matchStatus === "verified"
            ? `${investorResolution.reason} Canonical project link for FundingRound is missing, so verified investor matches are downgraded to proposed.`
            : investorResolution.reason,
        matchStatus,
        rawInvestor: this.rawInvestorPayload(rawInvestor, investorResolution.candidates),
        candidates: investorResolution.candidates,
      });
    }

    return {
      roundId: fundingRoundId,
      canonicalProjectId,
      rawInvestorsScanned: this.arrayValue((round as any)?.investors).length + this.arrayValue((round as any)?.leadInvestors).length,
      participants,
    };
  }

  async resolveInvestor(
    rawInvestor: any,
    round?: any,
    batchCache?: FundingRoundParticipantResolverBatchCache,
  ): Promise<FundingRoundParticipantResolution> {
    const input = this.normalizeInvestorInput(rawInvestor, round);
    const cacheKey = this.investorResolutionCacheKey(input);
    const cached = this.investorResolutionCache.get(cacheKey);
    if (cached) return cached;

    const resolution = this.resolveInvestorInput(input, batchCache);
    this.investorResolutionCache.set(cacheKey, resolution);
    try {
      return await resolution;
    } catch (error) {
      this.investorResolutionCache.delete(cacheKey);
      throw error;
    }
  }

  private async resolveInvestorInput(
    input: NormalizedParticipantInvestorInput,
    batchCache?: FundingRoundParticipantResolverBatchCache,
  ): Promise<FundingRoundParticipantResolution> {
    const dropstabResult = await this.resolveByDropstabId(input, batchCache);
    if (dropstabResult.matchStatus !== "unmatched") return dropstabResult;

    const sourceResult = await this.resolveBySourceId(input, batchCache);
    if (sourceResult.matchStatus !== "unmatched") return sourceResult;

    const slugResult = await this.resolveBySlug(input, batchCache);
    if (slugResult.matchStatus !== "unmatched") return slugResult;

    const nameResult = await this.resolveByName(input, batchCache);
    if (nameResult.matchStatus !== "unmatched") return nameResult;

    return this.unmatched("No fund/person candidate matched by dropstab id, source id, source mapping, slug, or normalized name.");
  }

  private investorResolutionCacheKey(input: NormalizedParticipantInvestorInput): string {
    return [
      input.source,
      input.sourceId,
      input.sourceKey,
      input.dropstabId,
      input.numericDropstabId ?? "",
      input.slug,
      input.normalizedName,
    ].join("|");
  }

  private async resolveByDropstabId(input: NormalizedParticipantInvestorInput, batchCache?: FundingRoundParticipantResolverBatchCache) {
    if (input.numericDropstabId === null) return this.unmatched("Missing numeric Dropstab id.");
    if (batchCache) {
      const key = String(input.numericDropstabId);
      return this.resolveFromCandidateDocs(
        batchCache.fundsByDropstabId.get(key) || [],
        batchCache.personsByDropstabId.get(key) || [],
        "dropstabId",
        "Exact Dropstab investor id match.",
        100,
        "verified",
      );
    }
    return this.resolveFromQueries(
      [{ dropstabId: input.numericDropstabId }],
      [{ dropstabId: input.numericDropstabId }],
      "dropstabId",
      "Exact Dropstab investor id match.",
      100,
      "verified",
    );
  }

  private async resolveBySourceId(input: NormalizedParticipantInvestorInput, batchCache?: FundingRoundParticipantResolverBatchCache) {
    const ids = this.uniqueStrings([input.sourceId, input.sourceKey, input.dropstabId]);
    if (!ids.length) return this.unmatched("Missing source id.");

    if (batchCache) {
      return this.resolveFromCandidateDocs(
        this.uniqueDocs(ids.flatMap((id) => batchCache.fundsBySourceId.get(id) || [])),
        this.uniqueDocs(ids.flatMap((id) => batchCache.personsBySourceId.get(id) || [])),
        "sourceId",
        "Exact investor source id or sourceMappings.sourceId match.",
        95,
        "verified",
      );
    }

    const fundOr: any[] = [{ sourceKey: { $in: ids } }, { "sourceMappings.sourceId": { $in: ids } }];
    const personOr: any[] = [{ sourceKey: { $in: ids } }, { "sourceMappings.sourceId": { $in: ids } }];

    if (input.source) {
      fundOr.push({ source: input.source, sourceKey: { $in: ids } });
      fundOr.push({ sourceMappings: { $elemMatch: { source: input.source, sourceId: { $in: ids } } } });
      personOr.push({ source: input.source, sourceKey: { $in: ids } });
      personOr.push({ sourceMappings: { $elemMatch: { source: input.source, sourceId: { $in: ids } } } });
    }

    return this.resolveFromQueries(
      fundOr,
      personOr,
      "sourceId",
      "Exact investor source id or sourceMappings.sourceId match.",
      95,
      "verified",
    );
  }

  private async resolveBySlug(input: NormalizedParticipantInvestorInput, batchCache?: FundingRoundParticipantResolverBatchCache) {
    if (!input.slug) return this.unmatched("Missing investor slug.");

    if (batchCache) {
      return this.resolveFromCandidateDocs(
        batchCache.fundsBySlug.get(input.slug) || [],
        batchCache.personsBySlug.get(input.slug) || [],
        "slug",
        "Exact normalized investor slug/source slug match.",
        90,
        "verified",
      );
    }

    return this.resolveFromQueries(
      [{ slug: input.slug }, { sourceKey: input.slug }, { "sourceMappings.sourceSlug": input.slug }],
      [{ slug: input.slug }, { sourceKey: input.slug }, { "sourceMappings.sourceSlug": input.slug }],
      "slug",
      "Exact normalized investor slug/source slug match.",
      90,
      "verified",
    );
  }

  private async resolveByName(input: NormalizedParticipantInvestorInput, batchCache?: FundingRoundParticipantResolverBatchCache) {
    if (!input.normalizedName) return this.unmatched("Missing investor name.");

    if (batchCache) {
      return this.resolveFromCandidateDocs(
        batchCache.fundsByName.get(input.normalizedName) || [],
        batchCache.personsByName.get(input.normalizedName) || [],
        "normalizedName",
        "Unique normalized investor name match.",
        70,
        "proposed",
      );
    }

    return this.resolveFromQueries(
      [{ normalizedName: input.normalizedName }, { name: input.name }],
      [{ normalizedName: input.normalizedName }, { name: input.name }],
      "normalizedName",
      "Unique normalized investor name match.",
      70,
      "proposed",
    );
  }

  private async resolveFromQueries(
    fundOr: any[],
    personOr: any[],
    matchedBy: string,
    reason: string,
    confidence: number,
    matchStatus: FundingRoundParticipantMatchStatus,
  ): Promise<FundingRoundParticipantResolution> {
    const [funds, persons] = await Promise.all([
      fundOr.length ? this.fundsModel.find({ $or: fundOr }).select(this.investorProjection()).limit(25).lean() : [],
      personOr.length ? this.personModel.find({ $or: personOr }).select(this.investorProjection()).limit(25).lean() : [],
    ]);

    const candidates = this.dedupeCandidates([
      ...(funds as any[]).map((fund) => this.toCandidate("fund", fund, matchedBy, confidence)),
      ...(persons as any[]).map((person) => this.toCandidate("person", person, matchedBy, confidence)),
    ]);

    if (!candidates.length) return this.unmatched(`No fund/person candidate matched by ${matchedBy}.`);
    if (candidates.length > 1) {
      return {
        ...this.baseResolution(),
        participantType: "unknown",
        confidence,
        matchedBy,
        reason: `Multiple fund/person candidates matched by ${matchedBy}.`,
        matchStatus: "conflict",
        candidates,
      };
    }

    const candidate = candidates[0];
    return {
      ...this.baseResolution(),
      participantType: candidate.type,
      fundId: candidate.type === "fund" ? candidate.id : null,
      personId: candidate.type === "person" ? candidate.id : null,
      confidence,
      matchedBy,
      reason,
      matchStatus,
      candidates,
    };
  }

  private estimateAllocations(rawInvestors: any[], fundsRaised: number | null) {
    const allocations = new Map<string, { amountUsd?: number; allocationMethod: FundingRoundParticipantAllocationMethod }>();
    if (!rawInvestors.length) return allocations;

    for (const investor of rawInvestors) {
      const exactAmount = this.toNumber(investor.amountUsd ?? investor.amount ?? investor.allocationUsd);
      if (exactAmount !== null && exactAmount >= 0) {
        allocations.set(investor.__key, { amountUsd: exactAmount, allocationMethod: "exact" });
      }
    }

    if (fundsRaised === null || fundsRaised <= 0) {
      for (const investor of rawInvestors) {
        if (!allocations.has(investor.__key)) allocations.set(investor.__key, { allocationMethod: "unknown" });
      }
      return allocations;
    }

    for (const investor of rawInvestors) {
      if (allocations.has(investor.__key)) continue;
      if (investor.__role === "lead") {
        allocations.set(investor.__key, {
          amountUsd: fundsRaised * 0.5,
          allocationMethod: "lead_estimate",
        });
      } else {
        allocations.set(investor.__key, {
          amountUsd: fundsRaised / rawInvestors.length,
          allocationMethod: "equal_split_estimate",
        });
      }
    }

    return allocations;
  }

  private mergeRoundInvestors(round: any) {
    const leadKeys = new Set(this.arrayValue(round?.leadInvestors).map((investor) => this.investorKey(investor)));
    const byKey = new Map<string, any>();
    for (const investor of [...this.arrayValue(round?.investors), ...this.arrayValue(round?.leadInvestors)]) {
      const key = this.investorKey(investor);
      if (!key) continue;
      const existing = byKey.get(key) || {};
      const isLead = Boolean(investor?.lead) || leadKeys.has(key);
      byKey.set(key, {
        ...existing,
        ...investor,
        __key: key,
        __role: isLead ? "lead" : "participant",
      });
    }
    return Array.from(byKey.values());
  }

  private normalizeInvestorInput(rawInvestor: any, round?: any): NormalizedParticipantInvestorInput {
    const sourceId = this.cleanIdentifier(rawInvestor?.id ?? rawInvestor?.sourceInvestorId ?? rawInvestor?.sourceId);
    const dropstabId = this.cleanIdentifier(rawInvestor?.dropstabId ?? sourceId);
    return {
      name: this.cleanText(rawInvestor?.name ?? rawInvestor?.sourceInvestorName),
      normalizedName: this.normalizeName(rawInvestor?.name ?? rawInvestor?.sourceInvestorName),
      slug: this.normalizeSlug(rawInvestor?.investorSlug ?? rawInvestor?.slug ?? rawInvestor?.sourceInvestorSlug),
      source: this.roundSource(round, rawInvestor),
      sourceId,
      sourceKey: this.cleanIdentifier(rawInvestor?.sourceKey),
      dropstabId,
      numericDropstabId: this.toNullableNumber(dropstabId),
    };
  }

  private rawInvestorPayload(rawInvestor: any, candidates: FundingRoundParticipantCandidate[] = []) {
    const { __key, __role, ...raw } = rawInvestor || {};
    return candidates.length ? { ...raw, candidates } : raw;
  }

  private finalMatchStatus(matchStatus: FundingRoundParticipantMatchStatus, canonicalProjectId?: Types.ObjectId | null) {
    if (!canonicalProjectId && matchStatus === "verified") return "proposed";
    return matchStatus;
  }

  private legacyProjectId(round: any): Types.ObjectId | null {
    return (
      this.toObjectId(round?.projectId) ||
      this.toObjectId(this.arrayValue(round?.projectLinks).find((link) => link?.projectId)?.projectId) ||
      null
    );
  }

  private resolveFromCandidateDocs(
    funds: any[],
    persons: any[],
    matchedBy: string,
    reason: string,
    confidence: number,
    matchStatus: FundingRoundParticipantMatchStatus,
  ): FundingRoundParticipantResolution {
    const candidates = this.dedupeCandidates([
      ...(funds || []).map((fund) => this.toCandidate("fund", fund, matchedBy, confidence)),
      ...(persons || []).map((person) => this.toCandidate("person", person, matchedBy, confidence)),
    ]);

    if (!candidates.length) return this.unmatched(`No fund/person candidate matched by ${matchedBy}.`);
    if (candidates.length > 1) {
      return {
        ...this.baseResolution(),
        participantType: "unknown",
        confidence,
        matchedBy,
        reason: `Multiple fund/person candidates matched by ${matchedBy}.`,
        matchStatus: "conflict",
        candidates,
      };
    }

    const candidate = candidates[0];
    return {
      ...this.baseResolution(),
      participantType: candidate.type,
      fundId: candidate.type === "fund" ? candidate.id : null,
      personId: candidate.type === "person" ? candidate.id : null,
      confidence,
      matchedBy,
      reason,
      matchStatus,
      candidates,
    };
  }

  private collectBatchValues(inputs: NormalizedParticipantInvestorInput[]) {
    const numericDropstabIds = new Set<number>();
    const sourceIds = new Set<string>();
    const slugs = new Set<string>();
    const normalizedNames = new Set<string>();
    const names = new Set<string>();

    for (const input of inputs) {
      if (input.numericDropstabId !== null) numericDropstabIds.add(input.numericDropstabId);
      for (const value of this.uniqueStrings([input.sourceId, input.sourceKey, input.dropstabId])) sourceIds.add(value);
      if (input.slug) slugs.add(input.slug);
      if (input.normalizedName) normalizedNames.add(input.normalizedName);
      if (input.name) names.add(input.name);
    }

    return { numericDropstabIds, sourceIds, slugs, normalizedNames, names };
  }

  private batchLookupOr(values: {
    numericDropstabIds: Set<number>;
    sourceIds: Set<string>;
    slugs: Set<string>;
    normalizedNames: Set<string>;
    names: Set<string>;
  }) {
    const or: any[] = [];
    if (values.numericDropstabIds.size) or.push({ dropstabId: { $in: Array.from(values.numericDropstabIds) } });
    if (values.sourceIds.size) {
      const ids = Array.from(values.sourceIds);
      or.push({ sourceKey: { $in: ids } }, { "sourceMappings.sourceId": { $in: ids } });
    }
    if (values.slugs.size) {
      const slugs = Array.from(values.slugs);
      or.push({ slug: { $in: slugs } }, { sourceKey: { $in: slugs } }, { "sourceMappings.sourceSlug": { $in: slugs } });
    }
    if (values.normalizedNames.size) or.push({ normalizedName: { $in: Array.from(values.normalizedNames) } });
    if (values.names.size) or.push({ name: { $in: Array.from(values.names) } });
    return or;
  }

  private indexBatchCandidates(funds: any[], persons: any[]): FundingRoundParticipantResolverBatchCache {
    const cache: FundingRoundParticipantResolverBatchCache = {
      fundsByDropstabId: new Map(),
      personsByDropstabId: new Map(),
      fundsBySourceId: new Map(),
      personsBySourceId: new Map(),
      fundsBySlug: new Map(),
      personsBySlug: new Map(),
      fundsByName: new Map(),
      personsByName: new Map(),
    };

    for (const fund of funds || []) this.indexBatchCandidate(cache, "fund", fund);
    for (const person of persons || []) this.indexBatchCandidate(cache, "person", person);
    return cache;
  }

  private indexBatchCandidate(cache: FundingRoundParticipantResolverBatchCache, type: "fund" | "person", entity: any) {
    const dropstabIndex = type === "fund" ? cache.fundsByDropstabId : cache.personsByDropstabId;
    const sourceIndex = type === "fund" ? cache.fundsBySourceId : cache.personsBySourceId;
    const slugIndex = type === "fund" ? cache.fundsBySlug : cache.personsBySlug;
    const nameIndex = type === "fund" ? cache.fundsByName : cache.personsByName;

    this.addBatchIndex(dropstabIndex, entity?.dropstabId === undefined || entity?.dropstabId === null ? "" : String(entity.dropstabId), entity);
    for (const value of [
      entity?.sourceKey,
      ...(this.arrayValue(entity?.sourceMappings).map((mapping) => mapping?.sourceId)),
    ]) {
      this.addBatchIndex(sourceIndex, this.cleanIdentifier(value), entity);
    }
    for (const value of [
      entity?.slug,
      entity?.sourceKey,
      ...(this.arrayValue(entity?.sourceMappings).map((mapping) => mapping?.sourceSlug)),
    ]) {
      this.addBatchIndex(slugIndex, this.normalizeSlug(value), entity);
    }
    for (const value of [entity?.normalizedName, this.normalizeName(entity?.name)]) {
      this.addBatchIndex(nameIndex, this.normalizeName(value), entity);
    }
  }

  private addBatchIndex(index: Map<string, any[]>, key: string, entity: any) {
    if (!key || !entity?._id) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(entity);
  }

  private roundSource(round: any, rawInvestor?: any): string {
    return this.cleanText(rawInvestor?.source || round?.source || (rawInvestor?.id || rawInvestor?.dropstabId ? "dropstab" : "")).toLowerCase();
  }

  private investorKey(investor: any): string {
    const id = this.cleanIdentifier(investor?.id ?? investor?.sourceInvestorId ?? investor?.sourceId ?? investor?.dropstabId);
    if (id) return `id:${id}`;
    const slug = this.normalizeSlug(investor?.investorSlug ?? investor?.slug ?? investor?.sourceInvestorSlug);
    if (slug) return `slug:${slug}`;
    const name = this.normalizeName(investor?.name ?? investor?.sourceInvestorName);
    return name ? `name:${name}` : "";
  }

  private toCandidate(type: "fund" | "person", entity: any, matchedBy: string, confidence: number): FundingRoundParticipantCandidate {
    return {
      type,
      id: entity._id,
      name: entity.name,
      slug: entity.slug,
      matchedBy,
      confidence,
    };
  }

  private dedupeCandidates(candidates: FundingRoundParticipantCandidate[]) {
    const byKey = new Map<string, FundingRoundParticipantCandidate>();
    for (const candidate of candidates) byKey.set(`${candidate.type}:${candidate.id}`, candidate);
    return Array.from(byKey.values());
  }

  private uniqueDocs(docs: any[]) {
    const byId = new Map<string, any>();
    for (const doc of docs || []) {
      if (doc?._id) byId.set(String(doc._id), doc);
    }
    return Array.from(byId.values());
  }

  private investorProjection() {
    return {
      _id: 1,
      name: 1,
      slug: 1,
      source: 1,
      sourceKey: 1,
      dropstabId: 1,
      normalizedName: 1,
      sourceMappings: 1,
    };
  }

  private baseResolution(): FundingRoundParticipantResolution {
    return {
      fundingRoundId: null,
      participantType: "unknown",
      role: "unknown",
      allocationMethod: "unknown",
      confidence: 0,
      matchedBy: "none",
      reason: "",
      matchStatus: "unmatched",
    };
  }

  private unmatched(reason: string): FundingRoundParticipantResolution {
    return {
      ...this.baseResolution(),
      reason,
    };
  }

  private toObjectId(value: any): Types.ObjectId | null {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return null;
  }

  private toNumber(value: any): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toNullableNumber(value: any): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private cleanIdentifier(value: any): string {
    return String(value ?? "").trim();
  }

  private cleanText(value: any): string {
    return String(value || "").trim();
  }

  private normalizeName(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSlug(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/^https?:\/\/[^/]+\/?/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
  }
}

type NormalizedParticipantInvestorInput = {
  name: string;
  normalizedName: string;
  slug: string;
  source: string;
  sourceId: string;
  sourceKey: string;
  dropstabId: string;
  numericDropstabId: number | null;
};
