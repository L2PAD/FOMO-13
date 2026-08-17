import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { MONEY_PERMISSION_KEY } from "../auth/permission.decorator";
import { MoneyPermission } from "./money-permissions";
import { AdminPermissionsService } from "./admin-permissions.service";

/**
 * H3 — server-side MONEY_* enforcement. Runs AFTER JwtAuthGuard (so req.user is
 * set). Routes without @RequireMoneyPermission are allowed (auth still applies).
 * Attaches req.moneyPermissions + req.moneyTemplate for downstream audit.
 */
@Injectable()
export class MoneyPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly perms: AdminPermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<MoneyPermission[]>(MONEY_PERMISSION_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<Request>();
    const user: any = req.user || {};
    const roles: string[] = Array.isArray(user.role) ? user.role : [user.role].filter(Boolean);

    const eff = await this.perms.effectiveFor(String(user._id || ""), roles);
    (req as any).moneyTemplate = eff.template;
    (req as any).moneyPermissions = eff.permissions;

    if (!required || required.length === 0) return true;
    const missing = required.filter((p) => !eff.permissions.includes(p));
    if (missing.length) {
      throw new ForbiddenException(`Недостаточно прав: требуется ${missing.join(", ")}`);
    }
    (req as any).moneyPermissionUsed = required.join(",");
    return true;
  }
}
