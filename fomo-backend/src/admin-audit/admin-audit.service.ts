import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdminAuditEvent, AdminAuditEventDocument } from "./admin-audit.model";

export interface AuditLogInput {
  actorId?: string;
  actorRole?: string;
  domain: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: any;
  after?: any;
  reason?: string;
}

// Keys that must never be persisted to the audit trail.
const SECRET_KEYS = /(secret|password|token|apikey|api_key|authorization|privatekey|private_key|credential)/i;

function redact(value: any, depth = 0): any {
  if (value == null || depth > 4) return value ?? null;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEYS.test(k)) { out[k] = "[REDACTED]"; continue; }
      out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger("AdminAudit");

  constructor(
    @InjectModel(AdminAuditEvent.name)
    private readonly model: Model<AdminAuditEventDocument>,
  ) {}

  /** Append an audit event. Best-effort: never throws into the caller flow. */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.model.create({
        actorId: input.actorId || "system",
        actorRole: input.actorRole || "",
        domain: input.domain,
        action: input.action,
        targetType: input.targetType || "",
        targetId: input.targetId || "",
        before: redact(input.before) ?? null,
        after: redact(input.after) ?? null,
        reason: input.reason || "",
        createdAt: new Date(),
      });
    } catch (e: any) {
      this.logger.warn(`audit log failed: ${e?.message || e}`);
    }
  }

  async list(filter: { domain?: string; action?: string; targetId?: string; limit?: number } = {}): Promise<any[]> {
    const q: any = {};
    if (filter.domain) q.domain = filter.domain;
    if (filter.action) q.action = filter.action;
    if (filter.targetId) q.targetId = filter.targetId;
    return this.model.find(q).sort({ createdAt: -1 }).limit(Math.min(filter.limit || 100, 500)).lean();
  }
}
