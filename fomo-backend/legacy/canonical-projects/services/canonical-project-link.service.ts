import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CanonicalProjectLink,
  CanonicalProjectLinkCreatedBy,
  CanonicalProjectLinkEntityType,
  CanonicalProjectLinkProjectType,
  CanonicalProjectLinkStatus,
} from "../models/canonical-project-link.model";
import { CanonicalProjectLinkAuditLog } from "../models/canonical-project-link-audit-log.model";

export type CanonicalProjectLinkInput = {
  canonicalProjectId: any;
  entityType: CanonicalProjectLinkEntityType;
  entityId: any;
  legacyProjectId?: any;
  projectType?: CanonicalProjectLinkProjectType;
  source?: string;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  confidence?: number;
  matchedBy?: string;
  reason?: string;
  status?: CanonicalProjectLinkStatus;
  dryRun?: boolean;
  createdBy?: CanonicalProjectLinkCreatedBy;
};

export type CanonicalProjectLinkWriteOptions = {
  dryRun?: boolean;
  createdBy?: CanonicalProjectLinkCreatedBy;
  reason?: string;
  lookupCache?: CanonicalProjectLinkLookupCache;
};

export type CanonicalProjectLinkLookupCache = {
  byEntityCanonical?: Map<string, any>;
  verifiedByEntity?: Map<string, any>;
  dryRunByEntityCanonical?: Map<string, any>;
  dryRunVerifiedByEntity?: Map<string, any>;
};

@Injectable()
export class CanonicalProjectLinkService {
  constructor(
    @InjectModel(CanonicalProjectLink.name)
    private readonly canonicalProjectLinkModel: Model<CanonicalProjectLink>,
    @InjectModel(CanonicalProjectLinkAuditLog.name)
    private readonly auditLogModel: Model<CanonicalProjectLinkAuditLog>,
  ) {}

  async proposeLink(input: CanonicalProjectLinkInput, options: CanonicalProjectLinkWriteOptions = {}) {
    return this.ensureLink({ ...input, status: "proposed" }, options);
  }

  async verifyLink(linkId: any, options: CanonicalProjectLinkWriteOptions = {}) {
    const objectId = this.toObjectId(linkId);
    if (!objectId) return { status: "skipped", reason: "Invalid canonical project link id." };

    const link = await this.canonicalProjectLinkModel.findById(objectId).lean();
    if (!link) return { status: "skipped", reason: "Canonical project link not found." };

    const conflict = await this.findOtherVerifiedLink(link);
    if (conflict) {
      if (!options.dryRun) {
        await this.writeAudit({
          operation: "conflict",
          canonicalProjectId: link.canonicalProjectId,
          entityType: link.entityType,
          entityId: link.entityId,
          before: { link, conflict },
          dryRun: false,
          status: "conflict",
          reason: options.reason || "Verified link already exists for this entity.",
        });
      }
      return { status: "conflict", link, conflicts: [conflict] };
    }

    if (options.dryRun) return { status: "verified", link: { ...link, status: "verified" }, updated: true, dryRun: true };

    const updated = await this.canonicalProjectLinkModel
      .findByIdAndUpdate(
        objectId,
        {
          $set: {
            status: "verified",
            dryRun: false,
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean();

    await this.writeAudit({
      operation: "verify",
      canonicalProjectId: link.canonicalProjectId,
      entityType: link.entityType,
      entityId: link.entityId,
      before: link,
      after: updated,
      confidence: link.confidence,
      matchedBy: link.matchedBy,
      reason: options.reason || "Canonical project link verified.",
      dryRun: false,
      status: "success",
    });

    return { status: "verified", link: updated, updated: true };
  }

  async rejectLink(linkId: any, options: CanonicalProjectLinkWriteOptions = {}) {
    const objectId = this.toObjectId(linkId);
    if (!objectId) return { status: "skipped", reason: "Invalid canonical project link id." };

    const link = await this.canonicalProjectLinkModel.findById(objectId).lean();
    if (!link) return { status: "skipped", reason: "Canonical project link not found." };

    if (options.dryRun) return { status: "rejected", link: { ...link, status: "rejected" }, updated: true, dryRun: true };

    const updated = await this.canonicalProjectLinkModel
      .findByIdAndUpdate(
        objectId,
        {
          $set: {
            status: "rejected",
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean();

    await this.writeAudit({
      operation: "reject",
      canonicalProjectId: link.canonicalProjectId,
      entityType: link.entityType,
      entityId: link.entityId,
      before: link,
      after: updated,
      confidence: link.confidence,
      matchedBy: link.matchedBy,
      reason: options.reason || "Canonical project link rejected.",
      dryRun: false,
      status: "success",
    });

    return { status: "rejected", link: updated, updated: true };
  }

  async getLinksForEntity(entityType: CanonicalProjectLinkEntityType | string, entityId: any) {
    const objectId = this.toObjectId(entityId);
    if (!objectId) return [];

    return this.canonicalProjectLinkModel
      .find({ entityType, entityId: objectId })
      .sort({ status: 1, confidence: -1, updatedAt: -1 })
      .lean();
  }

  async getLinksForCanonical(canonicalProjectId: any) {
    const objectId = this.toObjectId(canonicalProjectId);
    if (!objectId) return [];

    return this.canonicalProjectLinkModel
      .find({ canonicalProjectId: objectId })
      .sort({ entityType: 1, status: 1, confidence: -1 })
      .lean();
  }

  async resolveCanonicalForEntity(entityType: CanonicalProjectLinkEntityType | string, entityId: any) {
    const links = await this.getLinksForEntity(entityType, entityId);
    const verified = links.find((link: any) => link.status === "verified");
    if (verified) return { status: "verified", canonicalProjectId: verified.canonicalProjectId, link: verified, links };

    const conflict = links.find((link: any) => link.status === "conflict");
    if (conflict) return { status: "conflict", canonicalProjectId: conflict.canonicalProjectId, link: conflict, links };

    const proposed = links.find((link: any) => link.status === "proposed");
    if (proposed) return { status: "proposed", canonicalProjectId: proposed.canonicalProjectId, link: proposed, links };

    return { status: "skipped", canonicalProjectId: null, link: null, links };
  }

  async ensureLink(input: CanonicalProjectLinkInput, options: CanonicalProjectLinkWriteOptions = {}) {
    const canonicalProjectId = this.toObjectId(input.canonicalProjectId);
    const entityId = this.toObjectId(input.entityId);
    if (!canonicalProjectId || !entityId || !input.entityType) {
      return { status: "skipped", reason: "Missing canonicalProjectId, entityType, or entityId.", linksCreated: 0 };
    }

    const desiredStatus: CanonicalProjectLinkStatus = input.status || "proposed";
    const dryRun = Boolean(options.dryRun || input.dryRun);
    const payload = this.linkPayload(input, canonicalProjectId, entityId, desiredStatus, dryRun, options);
    const entityCanonicalKey = this.entityCanonicalKey(input.entityType, entityId, canonicalProjectId);
    const entityKey = this.entityKey(input.entityType, entityId);

    if (dryRun) {
      const dryRunExisting = options.lookupCache?.dryRunByEntityCanonical?.get(entityCanonicalKey);
      if (dryRunExisting) {
        return {
          status: dryRunExisting.status,
          link: dryRunExisting,
          created: false,
          updated: false,
          linksCreated: 0,
          idempotent: true,
          dryRun: true,
        };
      }
    }

    const existingSame =
      options.lookupCache?.byEntityCanonical?.get(entityCanonicalKey) ||
      (dryRun && options.lookupCache
        ? null
        : await this.canonicalProjectLinkModel
            .findOne({
              canonicalProjectId,
              entityType: input.entityType,
              entityId,
            })
            .lean());

    if (desiredStatus === "verified") {
      const preloadedVerified =
        options.lookupCache?.dryRunVerifiedByEntity?.get(entityKey) ||
        options.lookupCache?.verifiedByEntity?.get(entityKey);
      let conflict = null;
      if (preloadedVerified) {
        conflict = String(preloadedVerified.canonicalProjectId) !== String(canonicalProjectId) ? preloadedVerified : null;
      } else if (dryRun && options.lookupCache) {
        conflict = null;
      } else {
        conflict = await this.canonicalProjectLinkModel
          .findOne({
            entityType: input.entityType,
            entityId,
            status: "verified",
            canonicalProjectId: { $ne: canonicalProjectId },
          })
          .lean();
      }

      if (conflict) {
        return this.handleConflict(payload, existingSame, conflict, dryRun, options.reason);
      }
    }

    if (existingSame) {
      return this.handleExistingLink(existingSame, payload, desiredStatus, dryRun, options.reason);
    }

    if (dryRun) {
      const link = { _id: new Types.ObjectId(), ...payload, __dryRun: true };
      this.rememberDryRunLink(link, options.lookupCache);
      return {
        status: desiredStatus,
        link,
        created: true,
        linksCreated: 1,
        dryRun: true,
      };
    }

    const created = await this.canonicalProjectLinkModel.create(payload);
    const createdObject = this.toPlain(created);
    await this.writeAudit({
      operation: this.auditOperationForStatus(desiredStatus),
      canonicalProjectId,
      entityType: input.entityType,
      entityId,
      after: createdObject,
      confidence: payload.confidence,
      matchedBy: payload.matchedBy,
      reason: payload.reason || options.reason || "Canonical project link created.",
      dryRun: false,
      status: desiredStatus === "conflict" ? "conflict" : "success",
    });

    return {
      status: desiredStatus,
      link: createdObject,
      created: true,
      linksCreated: 1,
    };
  }

  async getConflicts(limit = 100) {
    const normalizedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    return this.canonicalProjectLinkModel
      .find({ status: "conflict" })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(normalizedLimit)
      .lean();
  }

  static entityKey(entityType: string, entityId: any): string {
    return `${entityType}:${String(entityId)}`;
  }

  static entityCanonicalKey(entityType: string, entityId: any, canonicalProjectId: any): string {
    return `${CanonicalProjectLinkService.entityKey(entityType, entityId)}:${String(canonicalProjectId)}`;
  }

  private async handleExistingLink(
    existing: any,
    payload: Record<string, any>,
    desiredStatus: CanonicalProjectLinkStatus,
    dryRun: boolean,
    reason?: string,
  ) {
    const shouldUpgrade =
      existing.status !== desiredStatus &&
      (desiredStatus === "verified" ||
        existing.status === "conflict" ||
        existing.status === "stale" ||
        existing.status === "rejected");
    const shouldRaiseConfidence = Number(payload.confidence || 0) > Number(existing.confidence || 0);

    if (!shouldUpgrade && !shouldRaiseConfidence) {
      return {
        status: existing.status,
        link: existing,
        created: false,
        updated: false,
        linksCreated: 0,
        idempotent: true,
      };
    }

    const update: any = {
      ...payload,
      status: shouldUpgrade ? desiredStatus : existing.status,
      confidence: Math.max(Number(payload.confidence || 0), Number(existing.confidence || 0)),
      updatedAt: new Date(),
    };

    if (dryRun) {
      const link = { ...existing, ...update, __dryRun: true };
      this.rememberDryRunLink(link, undefined);
      return {
        status: update.status,
        link,
        created: false,
        updated: true,
        linksCreated: 0,
        dryRun: true,
      };
    }

    const updated = await this.canonicalProjectLinkModel
      .findByIdAndUpdate(existing._id, { $set: update }, { new: true })
      .lean();

    await this.writeAudit({
      operation: this.auditOperationForStatus(update.status),
      canonicalProjectId: update.canonicalProjectId,
      entityType: update.entityType,
      entityId: update.entityId,
      before: existing,
      after: updated,
      confidence: update.confidence,
      matchedBy: update.matchedBy,
      reason: update.reason || reason || "Canonical project link updated.",
      dryRun: false,
      status: update.status === "conflict" ? "conflict" : "success",
    });

    return {
      status: update.status,
      link: updated,
      created: false,
      updated: true,
      linksCreated: 0,
    };
  }

  private async handleConflict(
    payload: Record<string, any>,
    existingSame: any,
    conflict: any,
    dryRun: boolean,
    reason?: string,
  ) {
    const conflictPayload: any = {
      ...payload,
      status: "conflict",
      confidence: Math.min(Number(payload.confidence || 0), 99),
      reason: payload.reason || reason || "Entity already has a different verified canonical project link.",
    };

    if (dryRun) {
      const link = existingSame || { _id: new Types.ObjectId(), ...conflictPayload, __dryRun: true };
      this.rememberDryRunLink(link, undefined);
      return {
        status: "conflict",
        link,
        conflicts: [conflict],
        created: !existingSame,
        updated: Boolean(existingSame),
        linksCreated: existingSame ? 0 : 1,
        dryRun: true,
      };
    }

    const link = existingSame
      ? await this.canonicalProjectLinkModel
          .findByIdAndUpdate(existingSame._id, { $set: conflictPayload }, { new: true })
          .lean()
      : this.toPlain(await this.canonicalProjectLinkModel.create(conflictPayload));

    await this.writeAudit({
      operation: "conflict",
      canonicalProjectId: payload.canonicalProjectId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      before: { existingSame, conflict },
      after: link,
      confidence: conflictPayload.confidence,
      matchedBy: conflictPayload.matchedBy,
      reason: conflictPayload.reason,
      dryRun: false,
      status: "conflict",
    });

    return {
      status: "conflict",
      link,
      conflicts: [conflict],
      created: !existingSame,
      updated: Boolean(existingSame),
      linksCreated: existingSame ? 0 : 1,
    };
  }

  private async findOtherVerifiedLink(link: any) {
    return this.canonicalProjectLinkModel
      .findOne({
        entityType: link.entityType,
        entityId: link.entityId,
        status: "verified",
        canonicalProjectId: { $ne: link.canonicalProjectId },
      })
      .lean();
  }

  private linkPayload(
    input: CanonicalProjectLinkInput,
    canonicalProjectId: Types.ObjectId,
    entityId: Types.ObjectId,
    status: CanonicalProjectLinkStatus,
    dryRun: boolean,
    options: CanonicalProjectLinkWriteOptions,
  ) {
    return {
      canonicalProjectId,
      entityType: input.entityType,
      entityId,
      legacyProjectId: this.toObjectId(input.legacyProjectId),
      projectType: input.projectType,
      source: this.cleanString(input.source),
      sourceId: this.cleanString(input.sourceId),
      sourceSlug: this.cleanString(input.sourceSlug),
      sourceUrl: this.cleanString(input.sourceUrl),
      confidence: Math.max(0, Math.min(Number(input.confidence ?? 0), 100)),
      matchedBy: input.matchedBy,
      reason: input.reason,
      status,
      dryRun,
      createdBy: input.createdBy || options.createdBy || "system",
    };
  }

  private auditOperationForStatus(status: CanonicalProjectLinkStatus): string {
    if (status === "verified") return "verify";
    if (status === "rejected") return "reject";
    if (status === "conflict") return "conflict";
    return "propose";
  }

  private toObjectId(value: any): Types.ObjectId | null {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return null;
  }

  private cleanString(value: any): string {
    return String(value ?? "").trim();
  }

  private toPlain(value: any): any {
    if (!value) return value;
    if (typeof value.toObject === "function") return value.toObject();
    return value;
  }

  private entityKey(entityType: string, entityId: any): string {
    return CanonicalProjectLinkService.entityKey(entityType, entityId);
  }

  private entityCanonicalKey(entityType: string, entityId: any, canonicalProjectId: any): string {
    return CanonicalProjectLinkService.entityCanonicalKey(entityType, entityId, canonicalProjectId);
  }

  private rememberDryRunLink(link: any, lookupCache?: CanonicalProjectLinkLookupCache) {
    if (!lookupCache || !link?.entityType || !link?.entityId || !link?.canonicalProjectId) return;

    const entityKey = this.entityKey(link.entityType, link.entityId);
    const entityCanonicalKey = this.entityCanonicalKey(link.entityType, link.entityId, link.canonicalProjectId);
    lookupCache.dryRunByEntityCanonical?.set(entityCanonicalKey, link);
    if (link.status === "verified") {
      lookupCache.dryRunVerifiedByEntity?.set(entityKey, link);
    }
  }

  private async writeAudit(entry: Record<string, any>) {
    await this.auditLogModel.create(entry);
  }
}
