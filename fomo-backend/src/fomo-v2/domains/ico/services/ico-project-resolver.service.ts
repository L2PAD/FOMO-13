import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import {
  FomoV2CanonicalProject,
  FomoV2MarketAsset,
  FomoV2ProjectAssetLink,
} from "../../../models";
import { FomoV2ProjectSourceProfile } from "../../project-profiles";
import {
  cleanProjectProfileString,
  normalizeProjectIdentityValue,
  normalizeProjectNameForQuery,
  normalizeProjectSlugForQuery,
  normalizeProjectSymbolForQuery,
  uniqueProjectProfileStrings,
} from "../helpers";
import {
  IcoProjectIdentity,
  IcoProjectResolveCandidate,
  IcoProjectResolveResult,
  IcoProjectResolverOptions,
} from "../types";

@Injectable()
export class IcoProjectResolverService {
  constructor(
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly projectSourceProfileModel: Model<FomoV2ProjectSourceProfile>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
  ) {}

  async resolve(
    icoProject: Record<string, any>,
    options: IcoProjectResolverOptions = {},
  ): Promise<IcoProjectResolveResult> {
    const identity = this.toIdentity(icoProject, options.sourceType);

    const existingProfileResult = await this.resolveByExistingSourceProfile(identity);
    if (existingProfileResult) return existingProfileResult;

    const marketResult = await this.resolveByMarketLayer(identity);
    if (marketResult) return marketResult;

    const canonicalResult = await this.resolveByCanonicalProjects(identity);
    if (canonicalResult) return canonicalResult;

    return {
      action: "CREATE_NEW",
      confidence: 0,
      reviewReason: "NEW_PROJECT_CANDIDATE",
      reason:
        "No existing market asset, project asset link, or canonical project matched this ICO source project.",
      candidates: [],
    };
  }

  toIdentity(icoProject: Record<string, any>, sourceType = "icodrops"): IcoProjectIdentity {
    const raw = icoProject?.rawIcoData || {};
    const normalizedSourceType = normalizeProjectSourceType(
      sourceType || "icodrops",
    );
    const genericSourceProjectId = cleanProjectProfileString(
      icoProject?.sourceProjectId ||
        icoProject?.sourceId ||
        raw.sourceProjectId ||
        raw.sourceId,
    );
    const sourceProjectId = cleanProjectProfileString(
      genericSourceProjectId ||
        this.sourceProviderIdFromProject(icoProject, normalizedSourceType) ||
        this.toIdString(icoProject?._id),
    );
    const sourceSlug = normalizeProjectSlugForQuery(
      icoProject?.sourceSlug || icoProject?.slug || raw.sourceSlug || raw.slug || sourceProjectId,
    );
    const sourceUrl = cleanProjectProfileString(
      icoProject?.sourceUrl || icoProject?.detailUrl || raw.sourceUrl || raw.detailUrl,
    );
    const name = cleanProjectProfileString(icoProject?.name || raw.name);
    const symbol = cleanProjectProfileString(
      icoProject?.symbol || icoProject?.ticker || raw.symbol || raw.ticker,
    );
    const slug = normalizeProjectSlugForQuery(icoProject?.slug || raw.slug || sourceSlug);

    return {
      sourceType: normalizedSourceType,
      sourceProjectId,
      sourceSlug,
      sourceUrl,
      name,
      symbol,
      slug,
      normalizedName: normalizeProjectIdentityValue(name),
      normalizedSymbol: normalizeProjectIdentityValue(symbol),
      normalizedSlug: normalizeProjectIdentityValue(slug || sourceSlug),
      queryName: normalizeProjectNameForQuery(name),
      querySymbol: normalizeProjectSymbolForQuery(symbol),
      querySlug: normalizeProjectSlugForQuery(slug || sourceSlug),
      providerIds: this.providerIdsFromProject(
        icoProject,
        normalizedSourceType,
        genericSourceProjectId,
      ),
    };
  }

  private async resolveByExistingSourceProfile(
    identity: IcoProjectIdentity,
  ): Promise<IcoProjectResolveResult | null> {
    const clauses = [
      identity.sourceProjectId
        ? {
            sourceType: projectSourceTypeMongoPattern(identity.sourceType),
            sourceProjectId: identity.sourceProjectId,
          }
        : undefined,
      identity.sourceSlug
        ? {
            sourceType: projectSourceTypeMongoPattern(identity.sourceType),
            sourceSlug: identity.sourceSlug,
          }
        : undefined,
    ].filter(Boolean);

    if (!clauses.length) return null;

    const profiles = await this.projectSourceProfileModel
      .find({ $or: clauses })
      .limit(10)
      .lean();

    const candidates = (profiles as any[])
      .filter((profile) => profile?.canonicalProjectId)
      .map((profile) => ({
        source: "project_source_profile" as const,
        sourceProfileId: this.toIdString(profile._id),
        canonicalProjectId: this.toIdString(profile.canonicalProjectId),
        confidence: 100,
        matchedBy: "existing_source_profile",
        reason: "Existing project_source_profiles row already links this source project.",
        name: profile.name,
        symbol: profile.symbol,
        slug: profile.slug || profile.sourceSlug,
        payload: this.compactPayload(profile),
      }));

    const uniqueCanonicalIds = this.uniqueCanonicalIds(candidates);
    if (!uniqueCanonicalIds.length) return null;
    if (uniqueCanonicalIds.length > 1) {
      return this.reviewPotential(
        "Existing source profile lookup returned multiple canonical projects.",
        candidates,
      );
    }

    return {
      action: "LINK_EXISTING",
      canonicalProjectId: uniqueCanonicalIds[0],
      confidence: 100,
      matchedBy: "existing_source_profile",
      reason: "Existing project_source_profiles row has priority.",
      candidates,
    };
  }

  private async resolveByMarketLayer(
    identity: IcoProjectIdentity,
  ): Promise<IcoProjectResolveResult | null> {
    const marketAssets = await this.findMarketAssetCandidates(identity);
    if (!marketAssets.length) return null;

    const marketAssetIds = marketAssets.map((asset) => this.toIdString(asset._id)).filter(Boolean);
    const links = marketAssetIds.length
      ? await this.projectAssetLinkModel
          .find({
            marketAssetId: { $in: marketAssetIds.map((id) => this.toObjectIdOrString(id)) },
            status: { $ne: "deprecated" },
          })
          .limit(100)
          .lean()
      : [];

    const linksByMarketAssetId = new Map<string, any[]>();
    for (const link of links as any[]) {
      const key = this.toIdString(link.marketAssetId);
      linksByMarketAssetId.set(key, [...(linksByMarketAssetId.get(key) || []), link]);
    }

    const candidates: IcoProjectResolveCandidate[] = [];
    const unlinkedExactMarketAssets: IcoProjectResolveCandidate[] = [];

    for (const asset of marketAssets as any[]) {
      const marketMatch = this.classifyMarketAssetMatch(asset, identity);
      if (!marketMatch) continue;

      const assetId = this.toIdString(asset._id);
      const assetLinks = linksByMarketAssetId.get(assetId) || [];
      if (!assetLinks.length) {
        if (marketMatch.exact) {
          unlinkedExactMarketAssets.push({
            source: "market_asset",
            marketAssetId: assetId,
            confidence: marketMatch.confidence,
            matchedBy: marketMatch.matchedBy,
            reason:
              "Existing market asset matched, but no project_asset_links row maps it to canonical project.",
            name: asset.name,
            symbol: asset.symbol,
            slug: asset.slug,
            payload: this.compactPayload(asset),
          });
        }
        continue;
      }

      for (const link of assetLinks) {
        candidates.push({
          source: "market_asset",
          canonicalProjectId: this.toIdString(link.canonicalProjectId),
          marketAssetId: assetId,
          confidence: this.linkAdjustedConfidence(marketMatch.confidence, link),
          matchedBy: marketMatch.matchedBy,
          reason: `${marketMatch.reason} via existing project_asset_links.`,
          name: asset.name,
          symbol: asset.symbol,
          slug: asset.slug,
          linkStatus: link.status,
          verified: Boolean(link.verified),
          payload: {
            marketAsset: this.compactPayload(asset),
            projectAssetLink: this.compactPayload(link),
          },
        });
      }
    }

    const exactLinkedCandidates = candidates.filter((candidate) =>
      this.isExactMarketMatch(candidate.matchedBy),
    );
    const uniqueExactCanonicalIds = this.uniqueCanonicalIds(exactLinkedCandidates);

    if (uniqueExactCanonicalIds.length === 1) {
      const best = this.bestCandidateForCanonical(
        uniqueExactCanonicalIds[0],
        exactLinkedCandidates,
      );
      return {
        action: "LINK_EXISTING",
        canonicalProjectId: uniqueExactCanonicalIds[0],
        marketAssetId: best?.marketAssetId,
        confidence: best?.confidence || 95,
        matchedBy: best?.matchedBy || "market_layer",
        reason:
          "Matched through existing market_assets and project_asset_links before considering new canonical entities.",
        candidates: exactLinkedCandidates,
        hasMarketData: true,
      };
    }

    if (uniqueExactCanonicalIds.length > 1) {
      return this.reviewPotential(
        "Multiple canonical projects matched through existing market layer.",
        exactLinkedCandidates,
      );
    }

    if (unlinkedExactMarketAssets.length) {
      return this.reviewPotential(
        "Existing market asset matched this ICO project, but it is not linked to a canonical project yet.",
        unlinkedExactMarketAssets,
      );
    }

    const reviewCandidates = candidates.filter((candidate) => candidate.canonicalProjectId);
    if (reviewCandidates.length) {
      return this.reviewPotential(
        "Market layer returned partial project candidates that need manual confirmation.",
        reviewCandidates,
      );
    }

    return null;
  }

  private async resolveByCanonicalProjects(
    identity: IcoProjectIdentity,
  ): Promise<IcoProjectResolveResult | null> {
    const projects = await this.findCanonicalProjectCandidates(identity);
    if (!projects.length) return null;

    const exactCandidates: IcoProjectResolveCandidate[] = [];
    const reviewCandidates: IcoProjectResolveCandidate[] = [];

    for (const project of projects as any[]) {
      const match = this.classifyCanonicalProjectMatch(project, identity);
      if (!match) continue;

      const candidate: IcoProjectResolveCandidate = {
        source: "canonical_project",
        canonicalProjectId: this.toIdString(project._id),
        confidence: match.confidence,
        matchedBy: match.matchedBy,
        reason: match.reason,
        name: project.name,
        symbol: project.symbol,
        slug: project.slug,
        payload: this.compactPayload(project),
      };

      if (match.exact) exactCandidates.push(candidate);
      else reviewCandidates.push(candidate);
    }

    const uniqueExactIds = this.uniqueCanonicalIds(exactCandidates);
    if (uniqueExactIds.length === 1) {
      const best = this.bestCandidateForCanonical(uniqueExactIds[0], exactCandidates);
      return {
        action: "LINK_EXISTING",
        canonicalProjectId: uniqueExactIds[0],
        confidence: best?.confidence || 90,
        matchedBy: best?.matchedBy || "canonical_exact",
        reason: "Matched existing canonical project by exact normalized ICO identity.",
        candidates: exactCandidates,
      };
    }

    if (uniqueExactIds.length > 1) {
      return this.reviewPotential(
        "Multiple canonical projects matched exact ICO identity.",
        exactCandidates,
      );
    }

    if (reviewCandidates.length) {
      return this.reviewPotential(
        "Canonical project candidates matched only partially.",
        reviewCandidates,
      );
    }

    return null;
  }

  private async findMarketAssetCandidates(identity: IcoProjectIdentity): Promise<any[]> {
    const clauses: Record<string, any>[] = [];
    for (const [key, value] of Object.entries(identity.providerIds || {})) {
      if (value) clauses.push({ [`providerIds.${key}`]: value });
    }

    if (identity.querySymbol) {
      clauses.push({ normalizedSymbol: identity.querySymbol }, { symbol: identity.querySymbol });
    }
    if (identity.queryName) clauses.push({ normalizedName: identity.queryName });
    if (identity.querySlug) clauses.push({ slug: identity.querySlug });

    if (!clauses.length) return [];
    return this.marketAssetModel.find({ $or: clauses }).limit(50).lean();
  }

  private async findCanonicalProjectCandidates(identity: IcoProjectIdentity): Promise<any[]> {
    const clauses: Record<string, any>[] = [];
    if (identity.querySymbol) {
      clauses.push(
        { normalizedSymbol: identity.querySymbol },
        {
          aliases: {
            $elemMatch: {
              type: "symbol",
              normalizedValue: identity.querySymbol,
            },
          },
        },
      );
    }
    if (identity.queryName) {
      clauses.push(
        { normalizedName: identity.queryName },
        {
          aliases: {
            $elemMatch: {
              type: "name",
              normalizedValue: identity.queryName,
            },
          },
        },
      );
    }
    if (identity.querySlug) {
      clauses.push(
        { slug: identity.querySlug },
        {
          aliases: {
            $elemMatch: {
              type: "slug",
              normalizedValue: identity.querySlug,
            },
          },
        },
      );
    }
    for (const [key, value] of Object.entries(identity.providerIds || {})) {
      if (value) clauses.push({ [`providerIds.${key}`]: value });
    }

    if (!clauses.length) return [];
    return this.canonicalProjectModel.find({ $or: clauses }).limit(50).lean();
  }

  private classifyMarketAssetMatch(
    asset: any,
    identity: IcoProjectIdentity,
  ): { exact: boolean; confidence: number; matchedBy: string; reason: string } | null {
    const providerMatch = this.hasProviderMatch(asset?.providerIds, identity.providerIds);
    if (providerMatch) {
      return {
        exact: true,
        confidence: 100,
        matchedBy: "market_provider_id",
        reason: "Exact provider id match on existing market_assets.",
      };
    }

    const nameMatches = this.sameNormalizedName(asset, identity);
    const symbolMatches = this.sameNormalizedSymbol(asset, identity);
    const slugMatches = this.sameNormalizedSlug(asset, identity);

    if (symbolMatches && nameMatches) {
      return {
        exact: true,
        confidence: 98,
        matchedBy: "market_symbol_name",
        reason: "Exact normalized symbol and name match on existing market_assets.",
      };
    }

    if (slugMatches && nameMatches) {
      return {
        exact: true,
        confidence: 96,
        matchedBy: "market_slug_name",
        reason: "Exact normalized slug and name match on existing market_assets.",
      };
    }

    if (symbolMatches || nameMatches || slugMatches) {
      return {
        exact: false,
        confidence: symbolMatches || nameMatches ? 70 : 55,
        matchedBy: symbolMatches
          ? "market_symbol_only"
          : nameMatches
          ? "market_name_only"
          : "market_slug_similarity",
        reason:
          "Existing market asset partially matches the ICO identity and needs manual confirmation.",
      };
    }

    return null;
  }

  private classifyCanonicalProjectMatch(
    project: any,
    identity: IcoProjectIdentity,
  ): { exact: boolean; confidence: number; matchedBy: string; reason: string } | null {
    const providerMatch = this.hasProviderMatch(project?.providerIds, identity.providerIds);
    if (providerMatch) {
      return {
        exact: true,
        confidence: 100,
        matchedBy: "canonical_provider_id",
        reason: "Exact provider id match on existing canonical_projects.",
      };
    }

    const nameMatches = this.sameNormalizedName(project, identity);
    const symbolMatches = this.sameNormalizedSymbol(project, identity);
    const slugMatches = this.sameNormalizedSlug(project, identity);

    if (symbolMatches && nameMatches) {
      return {
        exact: true,
        confidence: 95,
        matchedBy: "canonical_symbol_name",
        reason: "Exact normalized symbol and name match on canonical_projects.",
      };
    }

    if (slugMatches && nameMatches) {
      return {
        exact: true,
        confidence: 92,
        matchedBy: "canonical_slug_name",
        reason: "Exact normalized slug and name match on canonical_projects.",
      };
    }

    if (symbolMatches || nameMatches || slugMatches) {
      return {
        exact: false,
        confidence: symbolMatches || nameMatches ? 65 : 50,
        matchedBy: symbolMatches
          ? "canonical_symbol_only"
          : nameMatches
          ? "canonical_name_only"
          : "canonical_slug_similarity",
        reason:
          "Canonical project partially matches the ICO identity and needs manual confirmation.",
      };
    }

    return null;
  }

  private reviewPotential(
    reason: string,
    candidates: IcoProjectResolveCandidate[],
  ): IcoProjectResolveResult {
    const best = [...candidates].sort((a, b) => b.confidence - a.confidence)[0];
    return {
      action: "REVIEW",
      confidence: best?.confidence || 0,
      reviewReason: "POTENTIAL_PROJECT_MATCH",
      reason,
      candidates,
      marketAssetId: best?.marketAssetId,
      hasMarketData: candidates.some((candidate) => candidate.source === "market_asset"),
    };
  }

  private sameNormalizedName(entity: any, identity: IcoProjectIdentity): boolean {
    if (!identity.normalizedName) return false;
    return this.entityNameValues(entity).includes(identity.normalizedName);
  }

  private sameNormalizedSymbol(entity: any, identity: IcoProjectIdentity): boolean {
    if (!identity.normalizedSymbol) return false;
    return this.entitySymbolValues(entity).includes(identity.normalizedSymbol);
  }

  private sameNormalizedSlug(entity: any, identity: IcoProjectIdentity): boolean {
    if (!identity.normalizedSlug) return false;
    return this.entitySlugValues(entity).includes(identity.normalizedSlug);
  }

  private entityNameValues(entity: any): string[] {
    return uniqueProjectProfileStrings([
      normalizeProjectIdentityValue(entity?.normalizedName),
      normalizeProjectIdentityValue(entity?.name),
      ...this.aliasValues(entity, "name"),
    ]);
  }

  private entitySymbolValues(entity: any): string[] {
    return uniqueProjectProfileStrings([
      normalizeProjectIdentityValue(entity?.normalizedSymbol),
      normalizeProjectIdentityValue(entity?.symbol),
      ...this.aliasValues(entity, "symbol"),
    ]);
  }

  private entitySlugValues(entity: any): string[] {
    return uniqueProjectProfileStrings([
      normalizeProjectIdentityValue(entity?.slug),
      normalizeProjectIdentityValue(entity?.sourceSlug),
      ...this.aliasValues(entity, "slug"),
    ]);
  }

  private aliasValues(entity: any, type: string): string[] {
    return (entity?.aliases || [])
      .filter((alias) => alias?.type === type)
      .flatMap((alias) => [
        normalizeProjectIdentityValue(alias?.normalizedValue),
        normalizeProjectIdentityValue(alias?.value),
      ]);
  }

  private hasProviderMatch(
    entityProviderIds: Record<string, any> = {},
    identityProviderIds: Record<string, any> = {},
  ): boolean {
    for (const [key, value] of Object.entries(identityProviderIds || {})) {
      const normalized = this.normalizeProviderId(value);
      if (!normalized) continue;
      if (this.normalizeProviderId(entityProviderIds?.[key]) === normalized) return true;
    }
    return false;
  }

  private isExactMarketMatch(matchedBy: string | undefined): boolean {
    return [
      "market_provider_id",
      "market_symbol_name",
      "market_slug_name",
    ].includes(String(matchedBy || ""));
  }

  private linkAdjustedConfidence(confidence: number, link: any): number {
    if (link?.status === "conflict") return Math.min(confidence, 50);
    if (link?.verified || link?.status === "active") return confidence;
    if (link?.status === "proposed") return Math.min(confidence, 90);
    return Math.min(confidence, 80);
  }

  private bestCandidateForCanonical(
    canonicalProjectId: string,
    candidates: IcoProjectResolveCandidate[],
  ): IcoProjectResolveCandidate | undefined {
    return candidates
      .filter((candidate) => candidate.canonicalProjectId === canonicalProjectId)
      .sort((a, b) => b.confidence - a.confidence)[0];
  }

  private uniqueCanonicalIds(candidates: IcoProjectResolveCandidate[]): string[] {
    return uniqueProjectProfileStrings(
      candidates.map((candidate) => candidate.canonicalProjectId),
    );
  }

  private providerIdsFromProject(
    project: Record<string, any> = {},
    sourceType?: string,
    genericSourceProjectId?: string,
  ): IcoProjectIdentity["providerIds"] {
    const raw = project.rawIcoData || {};
    const marketData = project.marketData || raw.marketData || {};
    const providerIds: IcoProjectIdentity["providerIds"] = {
      coingeckoId: this.normalizeProviderId(
        project.coingeckoId || raw.coingeckoId || marketData.coingeckoId,
      ),
      coinMarketCapId: this.normalizeProviderId(
        project.coinMarketCapId ||
          project.coinmarketcapId ||
          raw.coinMarketCapId ||
          raw.coinmarketcapId ||
          marketData.coinMarketCapId ||
          marketData.coinmarketcapId,
      ),
      dropstabId: this.normalizeProviderId(
        project.dropstabId || raw.dropstabId || raw.dropstabSlug,
      ),
      cryptorankId: this.normalizeProviderId(project.cryptorankId || raw.cryptorankId),
      icodropsId: this.normalizeProviderId(
        project.icodropsId || raw.icodropsId,
      ),
    };

    const sourceProviderKey = this.providerKeyForSource(sourceType);
    const normalizedGenericId = this.normalizeProviderId(genericSourceProjectId);
    if (
      sourceProviderKey &&
      normalizedGenericId &&
      !providerIds[sourceProviderKey]
    ) {
      providerIds[sourceProviderKey] = normalizedGenericId;
    }
    return providerIds;
  }

  private sourceProviderIdFromProject(
    project: Record<string, any>,
    sourceType: string,
  ): string | undefined {
    const raw = project.rawIcoData || {};
    const marketData = project.marketData || raw.marketData || {};
    const providerKey = this.providerKeyForSource(sourceType);
    if (!providerKey) return undefined;
    const values: Record<keyof IcoProjectIdentity["providerIds"], any[]> = {
      coingeckoId: [
        project.coingeckoId,
        raw.coingeckoId,
        marketData.coingeckoId,
      ],
      coinMarketCapId: [
        project.coinMarketCapId,
        project.coinmarketcapId,
        raw.coinMarketCapId,
        raw.coinmarketcapId,
        marketData.coinMarketCapId,
        marketData.coinmarketcapId,
      ],
      dropstabId: [project.dropstabId, raw.dropstabId, raw.dropstabSlug],
      cryptorankId: [project.cryptorankId, raw.cryptorankId],
      icodropsId: [project.icodropsId, raw.icodropsId],
    };
    return this.normalizeProviderId(values[providerKey].find(Boolean));
  }

  private providerKeyForSource(
    sourceType: string | undefined,
  ): keyof IcoProjectIdentity["providerIds"] | undefined {
    const sourceProviderKeys: Record<
      string,
      keyof IcoProjectIdentity["providerIds"]
    > = {
      coingecko: "coingeckoId",
      coinmarketcap: "coinMarketCapId",
      dropstab: "dropstabId",
      cryptorank: "cryptorankId",
      icodrops: "icodropsId",
    };
    return sourceProviderKeys[normalizeProjectSourceType(sourceType)];
  }

  private compactPayload(entity: any): Record<string, any> {
    return {
      _id: this.toIdString(entity?._id),
      name: entity?.name,
      symbol: entity?.symbol,
      slug: entity?.slug || entity?.sourceSlug,
      status: entity?.status,
      providerIds: entity?.providerIds,
      canonicalProjectId: this.toIdString(entity?.canonicalProjectId),
      marketAssetId: this.toIdString(entity?.marketAssetId),
    };
  }

  private normalizeProviderId(value: any): string | undefined {
    const text = cleanProjectProfileString(value)?.toLowerCase();
    return text || undefined;
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
}
