import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSource,
  FomoV2MarketAsset,
  FomoV2ProjectAssetLink,
  FomoV2SourceEntity,
} from "../models";
import { FomoV2Confidence, FomoV2ProviderIds, V2Source, V2SourceEntityType } from "../../../fomo-v2.types";

export interface ResolveCanonicalProjectInput {
  source: V2Source;
  sourceEntityType: V2SourceEntityType;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  name?: string;
  normalizedName?: string;
  symbol?: string;
  normalizedSymbol?: string;
  providerIds?: FomoV2ProviderIds;
  contracts?: Array<{
    chainId?: string;
    chainSlug?: string;
    address: string;
  }>;
  websiteDomain?: string;
  aliases?: Array<{
    type: string;
    value: string;
    normalizedValue?: string;
  }>;
  sourceSnapshotId?: string;
  sourceEntityId?: string;
}

export type ResolveCanonicalProjectStatus =
  | "matched"
  | "created_candidate"
  | "proposed"
  | "conflict"
  | "unresolved";

export type ResolveCanonicalProjectMatchedBy =
  | "provider_id"
  | "contract"
  | "source_entity"
  | "source_url"
  | "website_domain"
  | "strong_identity_bundle"
  | "name_only"
  | "symbol_only"
  | "none";

export interface ResolveCanonicalProjectResult {
  status: ResolveCanonicalProjectStatus;
  canonicalProjectId?: string;
  verified: boolean;
  confidence: FomoV2Confidence;
  matchedBy: ResolveCanonicalProjectMatchedBy;
  reason: string;
  candidates: Array<{
    canonicalProjectId: string;
    confidence: string;
    matchedBy: string;
    reason: string;
  }>;
  conflicts: Array<{
    type: string;
    reason: string;
    candidateIds: string[];
  }>;
  actions: Array<{
    type: string;
    description: string;
  }>;
}

type ResolverCandidate = ResolveCanonicalProjectResult["candidates"][number];

type NormalizedResolverInput = ResolveCanonicalProjectInput & {
  source: string;
  sourceEntityType: V2SourceEntityType;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  normalizedName?: string;
  normalizedSymbol?: string;
  websiteDomain?: string;
  providerIds: FomoV2ProviderIds;
  contractKeys: string[];
};

@Injectable()
export class ResolveCanonicalProjectService {
  constructor(
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2CanonicalProjectSource.name)
    private readonly canonicalProjectSourceModel: Model<FomoV2CanonicalProjectSource>,
    @InjectModel(FomoV2SourceEntity.name)
    private readonly sourceEntityModel: Model<FomoV2SourceEntity>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
  ) {}

  async resolveCanonicalProject(input: ResolveCanonicalProjectInput): Promise<ResolveCanonicalProjectResult> {
    const normalized = this.normalizeInput(input);

    const providerIdResult = await this.resolveByProviderIds(normalized);
    if (providerIdResult.status !== "unresolved") return providerIdResult;

    const contractResult = await this.resolveByContracts(normalized);
    if (contractResult.status !== "unresolved") return contractResult;

    const sourceEntityResult = await this.resolveBySourceEntity(normalized);
    if (sourceEntityResult.status !== "unresolved") return sourceEntityResult;

    const sourceUrlResult = await this.resolveBySourceUrl(normalized);
    if (sourceUrlResult.status !== "unresolved") return sourceUrlResult;

    const websiteDomainResult = await this.resolveByWebsiteDomain(normalized);
    if (websiteDomainResult.status !== "unresolved") return websiteDomainResult;

    const strongBundleResult = await this.resolveByStrongIdentityBundle(normalized);
    if (strongBundleResult.status !== "unresolved") return strongBundleResult;

    const nameOnlyResult = await this.resolveByNameOnly(normalized);
    if (nameOnlyResult.status !== "unresolved") return nameOnlyResult;

    const symbolOnlyResult = await this.resolveBySymbolOnly(normalized);
    if (symbolOnlyResult.status !== "unresolved") return symbolOnlyResult;

    return this.createdCandidate(normalized);
  }

  async resolve(input: ResolveCanonicalProjectInput): Promise<ResolveCanonicalProjectResult> {
    return this.resolveCanonicalProject(input);
  }

  private async resolveByProviderIds(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    const providerClauses = this.providerIdClauses(input.providerIds);
    if (!providerClauses.length) return this.unresolved("No provider ids supplied.");

    const candidates = await this.findCanonicalCandidates(
      { $or: providerClauses },
      "exact",
      "provider_id",
      "Exact provider id match on canonical project.",
    );
    if (candidates.length) {
      return this.toMatchedOrConflict(candidates, "provider_id", "Exact provider id match.", true, "exact");
    }

    const sourceEntityCandidates = await this.findSourceEntityCandidates(
      { $or: providerClauses.map((clause) => this.sourceEntityProviderClause(clause)) },
      "exact",
      "provider_id",
      "Exact provider id match on source entity registry.",
    );
    if (sourceEntityCandidates.length) {
      return this.toMatchedOrConflict(sourceEntityCandidates, "provider_id", "Exact provider id match.", true, "exact");
    }

    return this.unresolved("No provider id candidate found.");
  }

  private async resolveByContracts(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    if (!input.contractKeys.length) return this.unresolved("No chain-aware contracts supplied.");

    const contractClauses = input.contractKeys.map((contractKey) => {
      const [chainKey, normalizedAddress] = contractKey.split(":");
      return {
        contracts: {
          $elemMatch: {
            chainKey,
            normalizedAddress,
          },
        },
      };
    });

    const marketAssets = await this.marketAssetModel
      .find({
        $or: [{ contractKeys: { $in: input.contractKeys } }, ...contractClauses],
      })
      .limit(25)
      .lean();

    const marketAssetIds = this.uniqueStrings((marketAssets as any[]).map((asset) => this.toIdString(asset?._id)));
    if (!marketAssetIds.length) return this.unresolved("No market asset matched chain-aware contracts.");

    const links = await this.projectAssetLinkModel
      .find({
        marketAssetId: { $in: marketAssetIds.map((id) => this.toObjectIdOrString(id)) },
        status: { $ne: "deprecated" },
      })
      .limit(25)
      .lean();

    const candidates = this.candidatesFromIds(
      (links as any[]).map((link) => this.toIdString(link?.canonicalProjectId)),
      "exact",
      "contract",
      "Exact chain-aware contract match through market asset link.",
    );

    if (candidates.length) {
      return this.toMatchedOrConflict(candidates, "contract", "Exact chain-aware contract match.", true, "exact");
    }

    return this.unresolved("Contract matched market asset, but no canonical project link exists.");
  }

  private async resolveBySourceEntity(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    if (!input.source) return this.unresolved("Missing source.");

    if (input.sourceId) {
      const candidates = await this.findSourceEntityCandidates(
        {
          source: input.source,
          sourceEntityType: input.sourceEntityType,
          sourceId: input.sourceId,
        },
        "exact",
        "source_entity",
        "Exact source entity match by source, entity type, and source id.",
      );
      if (candidates.length) {
        return this.toMatchedOrConflict(candidates, "source_entity", "Exact source entity id match.", true, "exact");
      }
    }

    if (!input.sourceSlug) return this.unresolved("Missing source slug.");

    const candidates = await this.findSourceEntityCandidates(
      {
        source: input.source,
        sourceEntityType: input.sourceEntityType,
        sourceSlug: input.sourceSlug,
      },
      "high",
      "source_entity",
      "Unique source entity match by source, entity type, and source slug.",
    );

    if (candidates.length) {
      return this.toMatchedOrConflict(candidates, "source_entity", "Unique source entity slug match.", false, "high");
    }

    return this.unresolved("No source entity candidate found.");
  }

  private async resolveBySourceUrl(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    if (!input.sourceUrl) return this.unresolved("Missing source URL.");

    const sourceCandidates = await this.findCanonicalSourceCandidates(
      { sourceUrl: input.sourceUrl },
      "exact",
      "source_url",
      "Exact canonical project source URL match.",
    );
    if (sourceCandidates.length) {
      return this.toMatchedOrConflict(sourceCandidates, "source_url", "Exact source URL match.", true, "exact");
    }

    const entityCandidates = await this.findSourceEntityCandidates(
      { sourceUrl: input.sourceUrl },
      "exact",
      "source_url",
      "Exact source entity URL match.",
    );
    if (entityCandidates.length) {
      return this.toMatchedOrConflict(entityCandidates, "source_url", "Exact source URL match.", true, "exact");
    }

    return this.unresolved("No source URL candidate found.");
  }

  private async resolveByWebsiteDomain(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    if (!input.websiteDomain || !this.isSafeWebsiteDomain(input.websiteDomain)) {
      return this.unresolved("Missing or unsafe website domain.");
    }

    const canonicalCandidates = await this.findCanonicalCandidates(
      { primaryWebsiteDomain: input.websiteDomain },
      "high",
      "website_domain",
      "Verified website domain match on canonical project.",
    );
    if (canonicalCandidates.length) {
      return this.toMatchedOrConflict(canonicalCandidates, "website_domain", "Website domain match.", true, "high");
    }

    const sourceCandidates = await this.findCanonicalSourceCandidates(
      { websiteDomain: input.websiteDomain },
      "high",
      "website_domain",
      "Verified website domain match on canonical project source.",
    );
    if (sourceCandidates.length) {
      return this.toMatchedOrConflict(sourceCandidates, "website_domain", "Website domain match.", true, "high");
    }

    const entityCandidates = await this.findSourceEntityCandidates(
      { websiteDomain: input.websiteDomain },
      "high",
      "website_domain",
      "Verified website domain match on source entity.",
    );
    if (entityCandidates.length) {
      return this.toMatchedOrConflict(entityCandidates, "website_domain", "Website domain match.", true, "high");
    }

    return this.unresolved("No website domain candidate found.");
  }

  private async resolveByStrongIdentityBundle(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    if (!input.sourceSlug || !input.normalizedName || !input.normalizedSymbol) {
      return this.unresolved("Missing source slug, normalized name, or normalized symbol.");
    }

    const candidates = await this.findCanonicalCandidates(
      {
        $and: [
          {
            $or: [
              { slug: input.sourceSlug },
              { aliases: { $elemMatch: { type: "slug", normalizedValue: input.sourceSlug } } },
            ],
          },
          {
            $or: [
              { normalizedName: input.normalizedName },
              { aliases: { $elemMatch: { type: "name", normalizedValue: input.normalizedName } } },
            ],
          },
          {
            $or: [
              { normalizedSymbol: input.normalizedSymbol },
              { aliases: { $elemMatch: { type: "symbol", normalizedValue: input.normalizedSymbol } } },
            ],
          },
        ],
      },
      "high",
      "strong_identity_bundle",
      "Unique source slug, normalized name, and normalized symbol match.",
    );

    if (!candidates.length) return this.unresolved("No strong identity bundle candidate found.");
    if (this.uniqueCandidateIds(candidates).length > 1) {
      return this.conflict(candidates, "strong_identity_bundle", "Multiple canonical projects matched strong identity bundle.");
    }

    return this.proposed(candidates[0], "strong_identity_bundle", "Strong identity bundle matched one canonical project.");
  }

  private async resolveByNameOnly(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    if (!input.normalizedName) return this.unresolved("Missing normalized name.");

    const candidates = await this.findCanonicalCandidates(
      {
        $or: [
          { normalizedName: input.normalizedName },
          { aliases: { $elemMatch: { type: "name", normalizedValue: input.normalizedName } } },
        ],
      },
      "medium",
      "name_only",
      "Unique normalized name match. Proposed only.",
    );

    if (!candidates.length) return this.unresolved("No name-only candidate found.");
    if (this.uniqueCandidateIds(candidates).length > 1) {
      return this.conflict(candidates, "name_only", "Multiple canonical projects matched name-only lookup.");
    }

    return this.proposed(candidates[0], "name_only", "Name-only match is proposed only and never verified.");
  }

  private async resolveBySymbolOnly(input: NormalizedResolverInput): Promise<ResolveCanonicalProjectResult> {
    if (!input.normalizedSymbol) return this.unresolved("Missing normalized symbol.");

    const candidates = await this.findCanonicalCandidates(
      {
        $or: [
          { normalizedSymbol: input.normalizedSymbol },
          { aliases: { $elemMatch: { type: "symbol", normalizedValue: input.normalizedSymbol } } },
        ],
      },
      "low",
      "symbol_only",
      "Unique symbol match. Proposed only.",
    );

    if (!candidates.length) return this.unresolved("No symbol-only candidate found.");
    if (this.uniqueCandidateIds(candidates).length > 1) {
      return this.conflict(candidates, "symbol_only", "Multiple canonical projects matched symbol-only lookup.");
    }

    return this.proposed(candidates[0], "symbol_only", "Symbol-only match is proposed only and never verified.");
  }

  private async findCanonicalCandidates(
    query: Record<string, any>,
    confidence: FomoV2Confidence,
    matchedBy: ResolveCanonicalProjectMatchedBy,
    reason: string,
  ): Promise<ResolverCandidate[]> {
    const projects = await this.canonicalProjectModel.find(query).limit(25).lean();
    return this.candidatesFromIds(
      (projects as any[]).map((project) => this.toIdString(project?._id)),
      confidence,
      matchedBy,
      reason,
    );
  }

  private async findCanonicalSourceCandidates(
    query: Record<string, any>,
    confidence: FomoV2Confidence,
    matchedBy: ResolveCanonicalProjectMatchedBy,
    reason: string,
  ): Promise<ResolverCandidate[]> {
    const sources = await this.canonicalProjectSourceModel.find(query).limit(25).lean();
    return this.candidatesFromIds(
      (sources as any[]).map((source) => this.toIdString(source?.canonicalProjectId)),
      confidence,
      matchedBy,
      reason,
    );
  }

  private async findSourceEntityCandidates(
    query: Record<string, any>,
    confidence: FomoV2Confidence,
    matchedBy: ResolveCanonicalProjectMatchedBy,
    reason: string,
  ): Promise<ResolverCandidate[]> {
    if (query.$or && !query.$or.length) return [];
    const entities = await this.sourceEntityModel.find(query).limit(25).lean();
    return this.candidatesFromIds(
      (entities as any[]).map((entity) => this.toIdString(entity?.canonicalProjectId)),
      confidence,
      matchedBy,
      reason,
    );
  }

  private toMatchedOrConflict(
    candidates: ResolverCandidate[],
    matchedBy: ResolveCanonicalProjectMatchedBy,
    reason: string,
    verified: boolean,
    confidence: FomoV2Confidence,
  ): ResolveCanonicalProjectResult {
    const uniqueIds = this.uniqueCandidateIds(candidates);
    if (uniqueIds.length > 1) {
      return this.conflict(candidates, matchedBy, `Multiple canonical projects matched ${matchedBy}.`);
    }

    return {
      status: "matched",
      canonicalProjectId: uniqueIds[0],
      verified,
      confidence,
      matchedBy,
      reason,
      candidates,
      conflicts: [],
      actions: [],
    };
  }

  private proposed(
    candidate: ResolverCandidate,
    matchedBy: ResolveCanonicalProjectMatchedBy,
    reason: string,
  ): ResolveCanonicalProjectResult {
    return {
      status: "proposed",
      canonicalProjectId: candidate.canonicalProjectId,
      verified: false,
      confidence: candidate.confidence as FomoV2Confidence,
      matchedBy,
      reason,
      candidates: [candidate],
      conflicts: [],
      actions: [
        {
          type: "would_attach_as_proposed_match",
          description: `Would attach source to canonical project ${candidate.canonicalProjectId} as proposed.`,
        },
      ],
    };
  }

  private conflict(
    candidates: ResolverCandidate[],
    matchedBy: ResolveCanonicalProjectMatchedBy,
    reason: string,
  ): ResolveCanonicalProjectResult {
    const candidateIds = this.uniqueCandidateIds(candidates);
    return {
      status: "conflict",
      verified: false,
      confidence: "none",
      matchedBy,
      reason,
      candidates,
      conflicts: [
        {
          type: matchedBy,
          reason,
          candidateIds,
        },
      ],
      actions: [
        {
          type: "manual_review_required",
          description: "Resolver found multiple candidates and will not choose automatically.",
        },
      ],
    };
  }

  private createdCandidate(input: NormalizedResolverInput): ResolveCanonicalProjectResult {
    const label = input.name || input.sourceSlug || input.symbol || input.sourceId || "unknown project";
    return {
      status: "created_candidate",
      verified: false,
      confidence: "none",
      matchedBy: "none",
      reason: "No existing canonical project matched. Dry-run would create a new canonical project candidate.",
      candidates: [],
      conflicts: [],
      actions: [
        {
          type: "would_create_canonical_project",
          description: `Would create canonical project candidate for ${label}.`,
        },
      ],
    };
  }

  private unresolved(reason: string): ResolveCanonicalProjectResult {
    return {
      status: "unresolved",
      verified: false,
      confidence: "none",
      matchedBy: "none",
      reason,
      candidates: [],
      conflicts: [],
      actions: [],
    };
  }

  private normalizeInput(input: ResolveCanonicalProjectInput): NormalizedResolverInput {
    const normalizedName = this.cleanString(input.normalizedName) || this.normalizeName(input.name);
    const normalizedSymbol = this.cleanString(input.normalizedSymbol) || this.normalizeSymbol(input.symbol);
    const providerIds = this.normalizeProviderIds(input.providerIds || {});

    return {
      ...input,
      source: this.cleanString(input.source).toLowerCase(),
      sourceEntityType: input.sourceEntityType,
      sourceId: this.cleanString(input.sourceId),
      sourceSlug: this.normalizeSlug(input.sourceSlug),
      sourceUrl: this.cleanString(input.sourceUrl),
      normalizedName,
      normalizedSymbol,
      websiteDomain: this.normalizeDomain(input.websiteDomain),
      providerIds,
      contractKeys: this.contractKeys(input.contracts || []),
    };
  }

  private providerIdClauses(providerIds: FomoV2ProviderIds): Record<string, any>[] {
    return [
      ["coingeckoId", providerIds.coingeckoId],
      ["coinMarketCapId", providerIds.coinMarketCapId],
      ["dropstabId", providerIds.dropstabId],
      ["cryptorankId", providerIds.cryptorankId],
      ["icodropsId", providerIds.icodropsId],
    ]
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => ({ [`providerIds.${key}`]: value }));
  }

  private sourceEntityProviderClause(clause: Record<string, any>): Record<string, any> {
    return clause;
  }

  private normalizeProviderIds(providerIds: FomoV2ProviderIds): FomoV2ProviderIds {
    return {
      coingeckoId: this.normalizeProviderId(providerIds.coingeckoId),
      coinMarketCapId: this.normalizeProviderId(providerIds.coinMarketCapId),
      dropstabId: this.normalizeProviderId(providerIds.dropstabId),
      cryptorankId: this.normalizeProviderId(providerIds.cryptorankId),
      icodropsId: this.normalizeProviderId(providerIds.icodropsId),
    };
  }

  private normalizeProviderId(value: any): string | undefined {
    const clean = this.cleanString(value).toLowerCase();
    return clean || undefined;
  }

  private contractKeys(contracts: Array<{ chainId?: string; chainSlug?: string; address: string }>): string[] {
    return this.uniqueStrings(
      contracts
        .map((contract) => {
          const chainKey = this.cleanString(contract.chainId || contract.chainSlug).toLowerCase();
          const address = this.cleanString(contract.address).toLowerCase();
          if (!chainKey || !address) return "";
          return `${chainKey}:${address}`;
        })
        .filter(Boolean),
    );
  }

  private candidatesFromIds(
    ids: string[],
    confidence: FomoV2Confidence,
    matchedBy: ResolveCanonicalProjectMatchedBy,
    reason: string,
  ): ResolverCandidate[] {
    return this.uniqueStrings(ids).map((canonicalProjectId) => ({
      canonicalProjectId,
      confidence,
      matchedBy,
      reason,
    }));
  }

  private uniqueCandidateIds(candidates: ResolverCandidate[]): string[] {
    return this.uniqueStrings(candidates.map((candidate) => candidate.canonicalProjectId));
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(new Set(values.map((value) => this.cleanString(value)).filter(Boolean)));
  }

  private toObjectIdOrString(value: string): Types.ObjectId | string {
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
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

  private normalizeSymbol(value: any): string {
    return String(value || "")
      .trim()
      .replace(/^\$/, "")
      .toUpperCase();
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

  private normalizeDomain(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0]
      .trim();
  }

  private cleanString(value: any): string {
    return String(value || "").trim();
  }

  private isSafeWebsiteDomain(domain: string): boolean {
    const normalized = this.normalizeDomain(domain);
    if (!normalized) return false;

    const unsafeDomains = new Set([
      "x.com",
      "twitter.com",
      "t.me",
      "telegram.me",
      "discord.gg",
      "discord.com",
      "medium.com",
      "linktr.ee",
      "linktree.com",
      "docs.google.com",
      "github.com",
      "gitbook.io",
      "notion.site",
      "mirror.xyz",
    ]);

    if (unsafeDomains.has(normalized)) return false;
    if (normalized.startsWith("docs.")) return false;
    if (normalized.endsWith(".gitbook.io")) return false;
    if (normalized.endsWith(".notion.site")) return false;
    return true;
  }
}
