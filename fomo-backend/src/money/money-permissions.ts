/**
 * H3 — canonical MONEY_* permission model.
 *
 * A plain content `admin` must NOT automatically be able to sign USDC withdrawals
 * or manage signer/treasury. Enforcement is server-side (see MoneyPermissionGuard);
 * the frontend only reflects the effective permissions.
 */

export const MONEY_PERMISSIONS = [
  "MONEY_VIEW",
  "MONEY_ADJUST",
  "MONEY_WITHDRAW_REVIEW",
  "MONEY_WITHDRAW_EXECUTE",
  "MONEY_SETTINGS_EDIT",
  "MONEY_CREDENTIALS_MANAGE",
  "MONEY_RECONCILIATION",
] as const;

export type MoneyPermission = typeof MONEY_PERMISSIONS[number];

export const MONEY_PERMISSION_META: Record<MoneyPermission, string> = {
  MONEY_VIEW: "Просмотр финансов (баланс, транзакции, покупки, выводы, диагностика)",
  MONEY_ADJUST: "Корректировка балансов пользователей",
  MONEY_WITHDRAW_REVIEW: "Проверка/эскалация выводов (без подписи средств)",
  MONEY_WITHDRAW_EXECUTE: "Исполнение выводов (подпись on-chain перевода)",
  MONEY_SETTINGS_EDIT: "Изменение treasury / сети / контрактов + управление ролями",
  MONEY_CREDENTIALS_MANAGE: "Добавление/активация/отзыв executor-ключей",
  MONEY_RECONCILIATION: "Действия сверки (reconciliation)",
};

export type RoleTemplateKey = "support" | "moderator" | "finance_operator" | "finance_admin" | "superadmin";

export const ROLE_TEMPLATES: Record<RoleTemplateKey, MoneyPermission[]> = {
  support: ["MONEY_VIEW"],
  moderator: ["MONEY_VIEW"],
  finance_operator: ["MONEY_VIEW", "MONEY_WITHDRAW_REVIEW", "MONEY_RECONCILIATION"],
  finance_admin: ["MONEY_VIEW", "MONEY_WITHDRAW_REVIEW", "MONEY_RECONCILIATION", "MONEY_ADJUST", "MONEY_WITHDRAW_EXECUTE"],
  superadmin: [...MONEY_PERMISSIONS],
};

export const ROLE_TEMPLATE_META: { key: RoleTemplateKey; label: string; description: string }[] = [
  { key: "support", label: "Support", description: "Только просмотр финансов" },
  { key: "moderator", label: "Moderator", description: "Только просмотр финансов" },
  { key: "finance_operator", label: "Finance Operator", description: "Просмотр + проверка выводов + reconciliation (без подписи средств)" },
  { key: "finance_admin", label: "Finance Admin", description: "Финансовые корректировки + исполнение выводов" },
  { key: "superadmin", label: "Superadmin", description: "Полный контроль: treasury, сети, ключи, роли" },
];

/** Conservative default template for a user without an explicit assignment. */
export function defaultTemplateForJwtRoles(roles: string[] = []): RoleTemplateKey {
  const set = new Set((roles || []).map((r) => String(r || "").toLowerCase()));
  if (set.has("moderator")) return "moderator";
  // A plain `admin` gets review-only by default — never execute/settings/credentials.
  if (set.has("admin")) return "finance_operator";
  return "support";
}
