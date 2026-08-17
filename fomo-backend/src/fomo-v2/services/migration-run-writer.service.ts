import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes } from "crypto";
import { Model } from "mongoose";
import { FomoV2MigrationRun } from "../models";
import { FomoV2MigrationRunType } from "../fomo-v2.types";

export interface StartFomoV2MigrationRunInput {
  type: FomoV2MigrationRunType;
  dryRun: boolean;
  dbName: string;
  runKey?: string;
  requestedBy?: string;
  codeVersion?: string;
  options?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface FomoV2MigrationRunRef {
  id: string;
  runKey: string;
}

@Injectable()
export class FomoV2MigrationRunWriterService {
  constructor(
    @InjectModel(FomoV2MigrationRun.name)
    private readonly migrationRunModel: Model<FomoV2MigrationRun>,
  ) {}

  async startRun(input: StartFomoV2MigrationRunInput): Promise<FomoV2MigrationRunRef> {
    const runKey = input.runKey || this.generateRunKey(input.type);
    const doc = await this.migrationRunModel.create({
      runKey,
      type: input.type,
      status: "running",
      dryRun: input.dryRun,
      dbName: input.dbName,
      startedAt: new Date(),
      requestedBy: input.requestedBy,
      codeVersion: input.codeVersion,
      options: input.options || {},
      counters: {},
      errorItems: [],
      metadata: input.metadata || {},
    });

    return {
      id: this.toIdString((doc as any)._id),
      runKey,
    };
  }

  async completeRun(
    migrationRunId: string,
    counters: Record<string, any> = {},
    metadata: Record<string, any> = {},
  ): Promise<void> {
    await this.migrationRunModel.updateOne(
      { _id: migrationRunId },
      {
        $set: {
          status: "completed",
          finishedAt: new Date(),
          counters,
          metadata,
        },
      },
    );
  }

  async failRun(
    migrationRunId: string,
    error: any,
    counters: Record<string, any> = {},
    metadata: Record<string, any> = {},
  ): Promise<void> {
    await this.migrationRunModel.updateOne(
      { _id: migrationRunId },
      {
        $set: {
          status: "failed",
          finishedAt: new Date(),
          counters,
          metadata,
        },
        $push: {
          errorItems: {
            message: error?.message || String(error),
            stack: error?.stack,
            failedAt: new Date(),
          },
        },
      },
    );
  }

  private generateRunKey(type: FomoV2MigrationRunType): string {
    return `${type}:${new Date().toISOString()}:${randomBytes(4).toString("hex")}`;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
  }
}
