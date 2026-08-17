import { Inject, Injectable, Optional } from "@nestjs/common";
import {
  FOMO_V2_ACTIVITY_ENTITLEMENT_RESOLVER,
  FomoV2ActivityAccessTier,
  FomoV2ActivityEntitlementResolver,
  FomoV2ActivityViewerAccess,
} from "../types";
import { AccessResolverService } from "src/entitlements/access-resolver.service";

/**
 * EarlyLand Prime access policy.
 *
 * P0 (Access Consolidation): the canonical `AccessResolver` is the SINGLE
 * production authority for `earlyland.prime`. The legacy
 * `earlyland_access_settings.mode` switchboard has been removed — access is now
 * decided purely by entitlements (subscription / admin grant / migrated legacy
 * grant) with NFT on-chain kept as an explicit adapter source that can grant a
 * temporary entitlement. There is no parallel legacy-allow path anymore.
 */
@Injectable()
export class FomoV2ActivityAccessPolicyService {
  constructor(
    // NFT on-chain ownership — explicit adapter source (never perpetual by default).
    @Optional()
    @Inject(FOMO_V2_ACTIVITY_ENTITLEMENT_RESOLVER)
    private readonly entitlementResolver?: FomoV2ActivityEntitlementResolver,
    // Canonical Access Resolver — single source of truth for capabilities.
    @Optional()
    private readonly accessResolver?: AccessResolverService,
  ) {}

  private async resolveNft(
    user?: Record<string, any>,
  ): Promise<{ available: boolean; entitled: boolean }> {
    if (!this.entitlementResolver) return { available: false, entitled: false };
    try {
      return await this.entitlementResolver.resolve(user);
    } catch {
      return { available: false, entitled: false };
    }
  }

  async resolve(
    accessTier: FomoV2ActivityAccessTier,
    user?: Record<string, any>,
  ): Promise<FomoV2ActivityViewerAccess> {
    if (accessTier === "public") {
      return { allowed: true, contentRedacted: false, mode: "PUBLIC", source: "public" };
    }

    // Prime tier — requires an authenticated user.
    if (!user) {
      return { allowed: false, contentRedacted: true, reason: "auth_required", mode: "ENTITLEMENT" };
    }

    const userId = String((user as any)?._id || (user as any)?.id || "");

    // --- Single production decision: canonical AccessResolver ---
    const canonical = this.accessResolver
      ? await this.accessResolver.resolveAccess({ userId, capability: "earlyland.prime" })
      : {
          allowed: false,
          source: null as string | null,
          legacySource: false,
          validUntil: null as Date | null,
        };

    // NFT on-chain remains an explicit adapter source feeding the decision.
    // (To be migrated to a first-class NFT_EVENT entitlement later.)
    const nft = await this.resolveNft(user);

    const allowed = canonical.allowed || nft.entitled;
    const matchedBy = canonical.allowed
      ? (canonical as any).source || "entitlement"
      : nft.entitled
        ? "nft"
        : undefined;

    if (allowed) {
      return {
        allowed: true,
        contentRedacted: false,
        mode: "ENTITLEMENT",
        source: matchedBy,
        matchedBy,
        legacySource: (canonical as any).legacySource || undefined,
        expiresAt: (canonical as any).validUntil || undefined,
      } as FomoV2ActivityViewerAccess;
    }

    // Denied — user needs a subscription/grant OR an NFT-derived entitlement.
    return {
      allowed: false,
      contentRedacted: true,
      reason: "nft_or_grant_required",
      mode: "ENTITLEMENT",
      requirements: ["subscription_or_grant", "nft"],
    };
  }
}
