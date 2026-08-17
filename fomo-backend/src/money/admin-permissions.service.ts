import { Injectable, OnModuleInit, BadRequestException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import {
  MONEY_PERMISSIONS, MONEY_PERMISSION_META, MoneyPermission,
  ROLE_TEMPLATES, ROLE_TEMPLATE_META, RoleTemplateKey, defaultTemplateForJwtRoles,
} from "./money-permissions";

const COL = "money_admin_permissions";

/**
 * H3 — resolves effective MONEY_* permissions for an admin user.
 *
 *   effective = ROLE_TEMPLATES[template] ∪ grants − revokes
 *
 * Stored per-user in `money_admin_permissions`. Users without an explicit
 * assignment fall back to a conservative default template derived from their JWT
 * role (a plain `admin` gets review-only, never execute/settings/credentials).
 * At least one Superadmin is seeded so the system is operable.
 */
@Injectable()
export class AdminPermissionsService implements OnModuleInit {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  async onModuleInit() {
    try { await this.ensureSuperadminSeed(); } catch { /* best-effort */ }
  }

  private async ensureSuperadminSeed() {
    const hasSuper = await this.conn.collection(COL).findOne({ template: "superadmin" });
    if (hasSuper) return;
    // Prefer the canonical bootstrap admin; otherwise the earliest admin user.
    const users = this.conn.collection("users");
    let root: any = await users.findOne({ email: "admin@fomo.local" });
    if (!root) root = await users.findOne({ $or: [{ role: "admin" }, { role: { $in: ["admin"] } }] }, { sort: { createdAt: 1 } });
    if (!root) return;
    await this.conn.collection(COL).updateOne(
      { userId: String(root._id) },
      { $set: { userId: String(root._id), email: root.email || "", template: "superadmin", grants: [], revokes: [], updatedBy: "system:seed", updatedAt: new Date() } },
      { upsert: true },
    );
  }

  private computeEffective(template: RoleTemplateKey, grants: string[] = [], revokes: string[] = []): MoneyPermission[] {
    const base = new Set<string>(ROLE_TEMPLATES[template] || ROLE_TEMPLATES.support);
    (grants || []).forEach((g) => base.add(g));
    (revokes || []).forEach((r) => base.delete(r));
    return MONEY_PERMISSIONS.filter((p) => base.has(p));
  }

  /** Effective permissions for a user id, given their JWT roles for fallback. */
  async effectiveFor(userId: string, jwtRoles: string[] = []): Promise<{ template: RoleTemplateKey; permissions: MoneyPermission[]; source: "assignment" | "default" }> {
    const doc: any = userId ? await this.conn.collection(COL).findOne({ userId: String(userId) }) : null;
    if (doc && doc.template) {
      return { template: doc.template, permissions: this.computeEffective(doc.template, doc.grants, doc.revokes), source: "assignment" };
    }
    const template = defaultTemplateForJwtRoles(jwtRoles);
    return { template, permissions: this.computeEffective(template), source: "default" };
  }

  async has(userId: string, jwtRoles: string[], perm: MoneyPermission): Promise<boolean> {
    const eff = await this.effectiveFor(userId, jwtRoles);
    return eff.permissions.includes(perm);
  }

  templatesCatalog() {
    return {
      permissions: MONEY_PERMISSIONS.map((p) => ({ key: p, label: MONEY_PERMISSION_META[p] })),
      templates: ROLE_TEMPLATE_META.map((t) => ({ ...t, permissions: ROLE_TEMPLATES[t.key] })),
    };
  }

  /** List admin/moderator users with their effective money permissions. */
  async listAdmins() {
    const users = await this.conn.collection("users")
      .find({ $or: [{ role: "admin" }, { role: "moderator" }, { role: { $in: ["admin", "moderator"] } }] })
      .project({ email: 1, username: 1, role: 1, wallet: 1 })
      .toArray();
    const assignments = await this.conn.collection(COL).find({}).toArray();
    const aMap: Record<string, any> = {}; assignments.forEach((a: any) => (aMap[String(a.userId)] = a));
    const items = await Promise.all(users.map(async (u: any) => {
      const roles = Array.isArray(u.role) ? u.role : [u.role].filter(Boolean);
      const a = aMap[String(u._id)];
      const template: RoleTemplateKey = a?.template || defaultTemplateForJwtRoles(roles);
      return {
        userId: String(u._id),
        email: u.email || "",
        username: u.username || "",
        jwtRoles: roles,
        template,
        grants: a?.grants || [],
        revokes: a?.revokes || [],
        assigned: !!a,
        permissions: this.computeEffective(template, a?.grants, a?.revokes),
        updatedBy: a?.updatedBy || null,
        updatedAt: a?.updatedAt || null,
      };
    }));
    return { items };
  }

  /** Superadmin-only: set a user's template + individual overrides. */
  async setAssignment(userId: string, body: { template?: RoleTemplateKey; grants?: string[]; revokes?: string[] }, actor: string) {
    if (!userId) throw new BadRequestException("userId required");
    const template = body.template || "support";
    if (!ROLE_TEMPLATES[template]) throw new BadRequestException("Unknown template");
    const grants = (body.grants || []).filter((g) => (MONEY_PERMISSIONS as readonly string[]).includes(g));
    const revokes = (body.revokes || []).filter((r) => (MONEY_PERMISSIONS as readonly string[]).includes(r));
    const user = await this.conn.collection("users").findOne({ _id: new Types.ObjectId(userId) }, { projection: { email: 1 } }).catch(() => null);
    const before: any = await this.conn.collection(COL).findOne({ userId: String(userId) });
    await this.conn.collection(COL).updateOne(
      { userId: String(userId) },
      { $set: { userId: String(userId), email: user?.email || before?.email || "", template, grants, revokes, updatedBy: actor, updatedAt: new Date() } },
      { upsert: true },
    );
    return {
      before: before ? { template: before.template, grants: before.grants, revokes: before.revokes } : null,
      after: { template, grants, revokes, permissions: this.computeEffective(template, grants, revokes) },
    };
  }
}
