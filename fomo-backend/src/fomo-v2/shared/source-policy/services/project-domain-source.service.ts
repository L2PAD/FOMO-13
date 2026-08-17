import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  cleanProjectDomainSourceObject,
  normalizeProjectDomain,
  normalizeProjectSourceType,
  toProjectDomainSourceObjectId,
} from "../helpers";
import {
  FomoV2ProjectDomainSourceLockInput,
  FomoV2ProjectDomainSourceLockResult,
} from "../types";
import {
  FomoV2ProjectDomainSource,
  FomoV2ProjectDomainSourceDocument,
} from "../models";

@Injectable()
export class FomoV2ProjectDomainSourceService {
  constructor(
    @InjectModel(FomoV2ProjectDomainSource.name)
    private readonly projectDomainSourceModel: Model<FomoV2ProjectDomainSource>
  ) {}

  async getLock(
    canonicalProjectId: Types.ObjectId | string,
    domain: string
  ): Promise<FomoV2ProjectDomainSource | null> {
    const projectId = this.requireObjectId(
      canonicalProjectId,
      "canonicalProjectId"
    );
    const normalizedDomain = this.requireNormalizedDomain(domain);
    return this.projectDomainSourceModel
      .findOne({ canonicalProjectId: projectId, domain: normalizedDomain })
      .lean();
  }

  async ensureLock(
    input: FomoV2ProjectDomainSourceLockInput
  ): Promise<
    FomoV2ProjectDomainSourceLockResult<FomoV2ProjectDomainSourceDocument>
  > {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const domain = this.requireNormalizedDomain(input.domain);
    const sourceType = this.requireSourceType(input.sourceType);
    const existing = await this.projectDomainSourceModel
      .findOne({ canonicalProjectId, domain })
      .exec();

    if (!existing) {
      try {
        const lock = await this.projectDomainSourceModel.create(
          cleanProjectDomainSourceObject({
            canonicalProjectId,
            domain,
            selectedSourceType: sourceType,
            status: "locked",
            reason: input.reason,
            createdBySyncRunId: this.syncRunId(input.syncRunId),
            updatedBySyncRunId: this.syncRunId(input.syncRunId),
            metadata: input.metadata || {},
          })
        );
        return { allowed: true, action: "created_lock", lock };
      } catch (error: any) {
        if (error?.code !== 11000) throw error;
        return this.ensureLock(input);
      }
    }

    if (normalizeProjectSourceType(existing.selectedSourceType) === sourceType) {
      return { allowed: true, action: "matched_lock", lock: existing };
    }

    return {
      allowed: false,
      action: "source_conflict",
      lock: existing,
      currentSourceType: existing.selectedSourceType,
      incomingSourceType: sourceType,
    };
  }

  private requireObjectId(value: any, field: string): Types.ObjectId {
    const objectId = toProjectDomainSourceObjectId(value);
    if (!objectId)
      throw new Error(`Invalid ${field} ObjectId value "${value}".`);
    return objectId;
  }

  private requireNormalizedDomain(value: any): string {
    const domain = normalizeProjectDomain(value);
    if (!domain) throw new Error("Project domain source lock requires domain.");
    return domain;
  }

  private requireSourceType(value: any): string {
    const sourceType = normalizeProjectSourceType(value);
    if (!sourceType)
      throw new Error("Project domain source lock requires sourceType.");
    return sourceType;
  }

  private syncRunId(value: any): Types.ObjectId | string | undefined {
    return (
      toProjectDomainSourceObjectId(value) ||
      (value ? String(value) : undefined)
    );
  }
}
