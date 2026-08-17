import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2MarketAsset,
  FomoV2ProjectAssetLink,
} from "../../../models";
import {
  ResolveCanonicalProjectService,
} from "../../../services/resolve-canonical-project.service";
import { FomoV2ProjectSourceProfile } from "../../project-profiles";
import {
  dropstabVestingProjectIdentity,
  DropstabVestingProjectIdentity,
  normalizeDropstabSourceType,
  toDropstabObjectId,
  toDropstabVestingIdString,
} from "../helpers";

export type FomoV2VestingProjectLinkStatus =
  | "linked"
  | "source_only"
  | "ambiguous"
  | "alias_mismatch";

export interface FomoV2VestingProjectLinkResult {
  status: FomoV2VestingProjectLinkStatus;
  identity: DropstabVestingProjectIdentity;
  canonicalProjectId?: Types.ObjectId;
  canonicalProjectIdString?: string;
  matchedBy: string;
  confidence: string;
  verified: boolean;
  reason: string;
  candidates?: any[];
}

export interface FomoV2VestingMarketAssetLinkResult {
  marketAssetId?: Types.ObjectId;
  marketAssetIdString?: string;
  status: "linked" | "missing";
  matchedBy?: string;
  reason?: string;
}

@Injectable()
export class FomoV2VestingLinkingService {
  constructor(
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly projectSourceProfileModel: Model<FomoV2ProjectSourceProfile>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    private readonly resolver: ResolveCanonicalProjectService
  ) {}

  async resolveProject(
    sourceProject: Record<string, any>,
    sourceType = "dropstab"
  ): Promise<FomoV2VestingProjectLinkResult> {
    const normalizedSourceType = normalizeDropstabSourceType(sourceType);
    const identity = dropstabVestingProjectIdentity(sourceProject);
    const profileResult = await this.resolveByProjectSourceProfile(
      identity,
      normalizedSourceType
    );

    if (profileResult.status === "ambiguous") return profileResult;

    const resolverResult = await this.resolver.resolve({
      source: normalizedSourceType,
      sourceEntityType: "project",
      sourceId: identity.sourceProjectId || identity.sourceId,
      sourceSlug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      name: identity.name,
      normalizedName: identity.normalizedName,
      symbol: identity.symbol,
      normalizedSymbol: identity.normalizedSymbol,
      providerIds: {
        coingeckoId: identity.coingeckoId,
        dropstabId: identity.sourceProjectId || identity.sourceId,
      },
    });

    if (profileResult.status === "linked") {
      const resolverCanonicalId = toDropstabVestingIdString(
        resolverResult.canonicalProjectId
      );
      if (
        resolverCanonicalId &&
        resolverCanonicalId !== profileResult.canonicalProjectIdString &&
        resolverResult.status !== "created_candidate"
      ) {
        return {
          ...profileResult,
          status: "alias_mismatch",
          matchedBy: "project_source_profiles_vs_resolver",
          reason:
            "project_source_profiles and resolver point to different canonical projects.",
          candidates: [
            ...(profileResult.candidates || []),
            ...(resolverResult.candidates || []),
          ],
        };
      }
      return profileResult;
    }

    if (
      this.isTrustedResolverLink(resolverResult) &&
      resolverResult.canonicalProjectId
    ) {
      const canonicalProjectId = toDropstabObjectId(
        resolverResult.canonicalProjectId
      );
      return {
        status: "linked",
        identity,
        canonicalProjectId,
        canonicalProjectIdString: resolverResult.canonicalProjectId,
        matchedBy: resolverResult.matchedBy,
        confidence: resolverResult.confidence,
        verified: resolverResult.verified,
        reason: resolverResult.reason,
        candidates: resolverResult.candidates,
      };
    }

    if (resolverResult.status === "conflict" || resolverResult.status === "proposed") {
      return {
        status: "ambiguous",
        identity,
        matchedBy: resolverResult.matchedBy,
        confidence: "none",
        verified: false,
        reason:
          resolverResult.status === "proposed"
            ? `Resolver proposed a canonical project but did not verify it: ${resolverResult.reason}`
            : resolverResult.reason,
        candidates: resolverResult.candidates,
      };
    }

    return {
      status: "source_only",
      identity,
      matchedBy: "none",
      confidence: "none",
      verified: false,
      reason: resolverResult.reason,
      candidates: resolverResult.candidates,
    };
  }

  private isTrustedResolverLink(input: {
    status: string;
    matchedBy: string;
    confidence: string;
  }): boolean {
    if (input.status === "matched") return true;
    return (
      input.status === "proposed" &&
      input.matchedBy === "strong_identity_bundle" &&
      (input.confidence === "high" || input.confidence === "exact")
    );
  }

  async resolveMarketAsset(
    canonicalProjectId: Types.ObjectId | string | undefined
  ): Promise<FomoV2VestingMarketAssetLinkResult> {
    const projectId = toDropstabObjectId(canonicalProjectId);
    if (!projectId) {
      return {
        status: "missing",
        reason: "Missing canonicalProjectId.",
      };
    }
    const link = await this.projectAssetLinkModel
      .findOne({
        canonicalProjectId: projectId,
        relationType: "primary_token",
        status: { $ne: "deprecated" },
      })
      .sort({ verified: -1, status: 1, updatedAt: -1 })
      .lean();
    const marketAssetId = toDropstabObjectId((link as any)?.marketAssetId);
    if (!marketAssetId) {
      return {
        status: "missing",
        reason: "No primary token project_asset_links row.",
      };
    }
    const marketAsset = await this.marketAssetModel
      .findById(marketAssetId)
      .lean();
    if (!marketAsset || (marketAsset as any).status === "deprecated") {
      return {
        status: "missing",
        reason: "Primary market asset is missing or deprecated.",
      };
    }
    return {
      status: "linked",
      marketAssetId,
      marketAssetIdString: toDropstabVestingIdString(marketAssetId),
      matchedBy: "project_asset_links.primary_token",
      reason: "Resolved primary token through project_asset_links.",
    };
  }

  private async resolveByProjectSourceProfile(
    identity: DropstabVestingProjectIdentity,
    sourceType: string
  ): Promise<FomoV2VestingProjectLinkResult> {
    const clauses = [
      identity.sourceProjectId ? { sourceProjectId: identity.sourceProjectId } : undefined,
      identity.sourceId ? { sourceProjectId: identity.sourceId } : undefined,
      identity.sourceSlug ? { sourceSlug: identity.sourceSlug } : undefined,
      identity.sourceUrl ? { sourceUrl: identity.sourceUrl } : undefined,
    ].filter(Boolean);
    if (!clauses.length) {
      return {
        status: "source_only",
        identity,
        matchedBy: "project_source_profiles",
        confidence: "none",
        verified: false,
        reason: "No source identity values for project_source_profiles.",
      };
    }
    const profiles = await this.projectSourceProfileModel
      .find({ sourceType, $or: clauses })
      .limit(25)
      .lean();
    const canonicalIds = uniqueStrings(
      (profiles as any[]).map((profile) =>
        toDropstabVestingIdString(profile?.canonicalProjectId)
      )
    );
    if (canonicalIds.length > 1) {
      return {
        status: "ambiguous",
        identity,
        matchedBy: "project_source_profiles",
        confidence: "none",
        verified: false,
        reason: "project_source_profiles matched multiple canonical projects.",
        candidates: profiles,
      };
    }
    if (canonicalIds.length === 1) {
      return {
        status: "linked",
        identity,
        canonicalProjectId: toDropstabObjectId(canonicalIds[0]),
        canonicalProjectIdString: canonicalIds[0],
        matchedBy: "project_source_profiles",
        confidence: "exact",
        verified: true,
        reason: "Existing project_source_profiles row links this source project.",
        candidates: profiles,
      };
    }
    return {
      status: "source_only",
      identity,
      matchedBy: "project_source_profiles",
      confidence: "none",
      verified: false,
      reason: "No project_source_profiles match.",
    };
  }
}

function uniqueStrings(values: any[]): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean))
  );
}
