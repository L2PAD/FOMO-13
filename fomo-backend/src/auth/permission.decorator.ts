import { SetMetadata } from "@nestjs/common";
import { MoneyPermission } from "../money/money-permissions";

/**
 * Gate a route behind one or more MONEY_* permissions. Enforced by
 * MoneyPermissionGuard (server-side). ALL listed permissions are required.
 */
export const MONEY_PERMISSION_KEY = "money_permissions";
export const RequireMoneyPermission = (...perms: MoneyPermission[]) => SetMetadata(MONEY_PERMISSION_KEY, perms);
