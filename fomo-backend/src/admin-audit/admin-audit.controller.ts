import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { AdminAuditService } from "./admin-audit.service";

@Roles("admin,moderator")
@UseGuards(JwtAuthGuard)
@Controller("admin/audit")
export class AdminAuditController {
  constructor(private readonly service: AdminAuditService) {}

  @Get()
  list(
    @Query("domain") domain?: string,
    @Query("action") action?: string,
    @Query("targetId") targetId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.list({ domain, action, targetId, limit: limit ? Number(limit) : undefined });
  }
}
