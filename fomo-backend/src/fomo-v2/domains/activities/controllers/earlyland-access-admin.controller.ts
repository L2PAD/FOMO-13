import { Controller, Get, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { EarlyLandAccessAdminService } from "../services/earlyland-access-admin.service";

/**
 * DEPRECATED (P0 — Access Consolidation).
 *
 * The legacy EarlyLand access module is no longer a production access path.
 * All Prime access is now decided by the canonical AccessResolver and managed
 * from the admin section «Доступ и монетизация» (entitlements/grants).
 *
 * Write endpoints (settings mode switch + create/revoke legacy grants) have
 * been removed so no NEW legacy grants can be created. Only read-only endpoints
 * remain, exposed purely for historical audit of pre-migration data.
 */
@Controller("admin/fomo-v2/earlyland-access")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class EarlyLandAccessAdminController {
  constructor(private readonly service: EarlyLandAccessAdminService) {}

  /** @deprecated Read-only audit of the legacy access-mode singleton. */
  @Get("settings")
  getSettings() {
    return this.service.getSettings();
  }

  /** @deprecated Read-only audit of legacy grants (migrated to entitlements). */
  @Get("grants")
  listGrants() {
    return this.service.listGrants();
  }
}
