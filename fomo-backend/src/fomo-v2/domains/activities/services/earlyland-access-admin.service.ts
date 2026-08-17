import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  EarlyLandAccessGrant,
  EarlyLandAccessMode,
  EarlyLandAccessSettings,
} from "../models/earlyland-access.model";

const SETTINGS_KEY = "default";

/**
 * DEPRECATED (P0 — Access Consolidation).
 *
 * Read-only audit view of the pre-migration legacy EarlyLand access data.
 * The write paths (mode switch + create/revoke grants) were intentionally
 * removed so no NEW legacy grants/settings can be produced. Prime access is
 * now decided by the canonical AccessResolver and managed from the admin
 * section «Доступ и монетизация».
 */
@Injectable()
export class EarlyLandAccessAdminService {
  constructor(
    @InjectModel(EarlyLandAccessSettings.name)
    private readonly settingsModel: Model<EarlyLandAccessSettings>,
    @InjectModel(EarlyLandAccessGrant.name)
    private readonly grantModel: Model<EarlyLandAccessGrant>,
  ) {}

  /** @deprecated Read-only: last known legacy access-mode singleton (audit). */
  async getSettings(): Promise<{ mode: EarlyLandAccessMode | null; note: string; updatedBy: string; deprecated: true }> {
    const doc: any = await this.settingsModel.findOne({ key: SETTINGS_KEY }).lean();
    return {
      mode: (doc?.mode as EarlyLandAccessMode) || null,
      note: doc?.note || "",
      updatedBy: doc?.updatedBy || "",
      deprecated: true,
    };
  }

  /** @deprecated Read-only: legacy grants (already migrated to entitlements). */
  async listGrants(): Promise<any[]> {
    const rows: any[] = await this.grantModel.find().sort({ createdAt: -1 }).limit(500).lean();
    const now = Date.now();
    return rows.map((r) => ({
      id: String(r._id),
      userId: String(r.userId),
      userLabel: r.userLabel || "",
      reason: r.reason || "",
      grantedBy: r.grantedBy || "",
      grantedAt: r.grantedAt || r.createdAt || null,
      expiresAt: r.expiresAt || null,
      revokedAt: r.revokedAt || null,
      revokedBy: r.revokedBy || "",
      active:
        !r.revokedAt && (!r.expiresAt || new Date(r.expiresAt).getTime() > now),
    }));
  }
}
