import { Controller, ForbiddenException, Get, Headers, Query } from "@nestjs/common";
import { MoneyService } from "./money.service";

/**
 * External integration surface for the FOMO Intel site (payment logic lives ONLY
 * here). The external admin PULLS paid entitlements to grant/revoke access.
 * Secret-protected (header `x-intel-secret` or ?secret=). No JWT — it's server-to-server.
 */
@Controller("integrations/intel")
export class IntegrationsController {
  constructor(private readonly money: MoneyService) {}

  private assert(secret?: string) {
    const expected = process.env.INTEL_WEBHOOK_SECRET || "fomo-intel-dev-secret";
    if (!secret || secret !== expected) throw new ForbiddenException("Invalid integration secret");
  }

  @Get("entitlements")
  entitlements(@Headers("x-intel-secret") h?: string, @Query("secret") q?: string, @Query("product") product?: string) {
    this.assert(h || q);
    return this.money.intelEntitlementsExport(product || "FOMO_INTEL");
  }
}
