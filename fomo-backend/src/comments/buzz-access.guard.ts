// BUZZ-AI Stage 2 — server-side enforcement of BUZZ_FEED_ACCESS.
// Must run AFTER JwtAuthGuard/OptionalJwtGuard so req.user is populated.
// Admin/moderator bypass so they can moderate the gated feed.
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AccessResolverService } from "../entitlements/access-resolver.service";

@Injectable()
export class BuzzAccessGuard implements CanActivate {
  constructor(private readonly resolver: AccessResolverService) {}

  private roles(user: any): string[] {
    const r = user?.role ?? user?.roles ?? [];
    return (Array.isArray(r) ? r : [r]).map((x) => String(x).toLowerCase());
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const userId: string | undefined = user?._id;

    // staff bypass (moderation of the gated community)
    const roles = this.roles(user);
    if (roles.includes("admin") || roles.includes("moderator")) return true;

    const decision = await this.resolver.buzzFeedAccess(userId);
    if (decision.allowed) return true;

    throw new ForbiddenException({
      statusCode: 403,
      code: "BUZZ_FEED_ACCESS_REQUIRED",
      capability: "BUZZ_FEED_ACCESS",
      reason: decision.reason,
      message:
        decision.reason === "auth_required"
          ? "Sign in and unlock FOMO Community to continue."
          : "FOMO Community access required.",
      requirements: [
        { type: "membership", note: "eligible membership" },
        { type: "nft", note: "eligible FOMO NFT benefit" },
      ],
    });
  }
}
