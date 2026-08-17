import { FomoV2ActivityAccessPolicyService } from "./activity-access-policy.service";

/**
 * P0 (Access Consolidation) — deterministic acceptance for the Prime Access
 * Policy engine after the legacy `earlyland_access_settings` mode switchboard
 * was removed. Access is now decided by the canonical AccessResolver, with NFT
 * on-chain ownership kept as an explicit adapter source (OR semantics).
 *
 * Both the AccessResolver and the NFT entitlement resolver are mocked so every
 * branch (entitlement / NFT / denied) is exercised without a real wallet.
 */

// Mock the NFT entitlement resolver (stands in for SpaceportNftService).
const nftResolverFor = (entitled: boolean) => ({
  resolve: jest.fn().mockResolvedValue({ entitled, available: true }),
});

// Mock the canonical AccessResolver decision for `earlyland.prime`.
const accessResolverFor = (allowed: boolean, source: string | null = null) => ({
  resolveAccess: jest.fn().mockResolvedValue({
    allowed,
    source,
    legacySource: false,
    validUntil: null,
  }),
});

const buildService = (opts: { entitlement?: boolean; nft?: boolean; source?: string }) =>
  new FomoV2ActivityAccessPolicyService(
    nftResolverFor(Boolean(opts.nft)) as any,
    accessResolverFor(Boolean(opts.entitlement), opts.source ?? null) as any,
  );

const USER = { _id: "507f1f77bcf86cd799439011" };

describe("FomoV2ActivityAccessPolicyService — resolver-only Prime access (P0)", () => {
  it("PUBLIC activity tier is always allowed", async () => {
    const service = new FomoV2ActivityAccessPolicyService();
    await expect(service.resolve("public")).resolves.toMatchObject({
      allowed: true,
      contentRedacted: false,
      mode: "PUBLIC",
    });
  });

  it("Prime + anonymous viewer → auth_required (deny)", async () => {
    const service = buildService({});
    await expect(service.resolve("prime")).resolves.toMatchObject({
      allowed: false,
      contentRedacted: true,
      reason: "auth_required",
    });
  });

  it("Prime + active entitlement (e.g. subscription) → allowed", async () => {
    const service = buildService({ entitlement: true, source: "subscription" });
    await expect(service.resolve("prime", USER)).resolves.toMatchObject({
      allowed: true,
      contentRedacted: false,
      mode: "ENTITLEMENT",
      matchedBy: "subscription",
    });
  });

  it("Prime + no entitlement but NFT owned → allowed via nft", async () => {
    const service = buildService({ entitlement: false, nft: true });
    await expect(service.resolve("prime", USER)).resolves.toMatchObject({
      allowed: true,
      matchedBy: "nft",
    });
  });

  it("Prime + entitlement takes precedence over nft as matchedBy", async () => {
    const service = buildService({ entitlement: true, source: "admin_grant", nft: true });
    await expect(service.resolve("prime", USER)).resolves.toMatchObject({
      allowed: true,
      matchedBy: "admin_grant",
    });
  });

  it("Prime + neither entitlement nor NFT → denied (nft_or_grant_required)", async () => {
    const service = buildService({ entitlement: false, nft: false });
    await expect(service.resolve("prime", USER)).resolves.toMatchObject({
      allowed: false,
      contentRedacted: true,
      reason: "nft_or_grant_required",
      requirements: ["subscription_or_grant", "nft"],
    });
  });
});
