import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PendingProjectMatch, PendingProjectMatchDocument } from "./models/pending-project-match.model";
import { ProjectSourceMap, ProjectSourceMapDocument } from "./models/project-source-map.model";

@Injectable()
export class ProjectIntelAdminService {
  constructor(
    @InjectModel(PendingProjectMatch.name) private readonly pendingMatchModel: Model<PendingProjectMatchDocument>,
    @InjectModel(ProjectSourceMap.name) private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
  ) {}

  async listPendingMatches(query: any = {}): Promise<any> {
    const limit = this.clampNumber(query.limit, 50, 1, 200);
    const offset = this.clampNumber(query.offset, 0, 0, 100000);
    const status = String(query.status || "pending");
    const filter: any = {};

    if (status !== "all") filter.status = status;
    if (query.source) filter.source = query.source;

    const [items, total] = await Promise.all([
      this.pendingMatchModel.find(filter).sort({ confidence: -1, updatedAt: -1 }).skip(offset).limit(limit).lean(),
      this.pendingMatchModel.countDocuments(filter),
    ]);

    return { items, total, limit, offset };
  }

  async approvePendingMatch(id: string, body: any = {}): Promise<any> {
    const pending = await this.pendingMatchModel.findById(id).lean();
    if (!pending) throw new NotFoundException("Pending project match not found");

    const projectId = body.projectId || pending.candidateProjectId;
    if (!projectId || !Types.ObjectId.isValid(String(projectId))) {
      throw new BadRequestException("projectId is required to approve this match");
    }

    await this.sourceMapModel.updateOne(
      { projectId: new Types.ObjectId(String(projectId)), source: pending.source },
      {
        $set: {
          projectId: new Types.ObjectId(String(projectId)),
          source: pending.source,
          sourceSlug: pending.sourceSlug,
          sourceId: pending.sourceId,
          sourceUrl: pending.sourceUrl,
          sourceName: pending.sourceName,
          sourceSymbol: pending.sourceSymbol,
          matchMethod: "manual",
          confidence: 100,
          isVerified: true,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true },
    );

    await this.pendingMatchModel.updateOne(
      { _id: pending._id },
      {
        $set: {
          status: "approved",
          candidateProjectId: new Types.ObjectId(String(projectId)),
          confidence: 100,
        },
      },
    );

    return { ok: true, id, status: "approved", projectId: String(projectId) };
  }

  async rejectPendingMatch(id: string): Promise<any> {
    const result = await this.pendingMatchModel.updateOne(
      { _id: id },
      { $set: { status: "rejected" } },
    );

    if (!result.matchedCount) throw new NotFoundException("Pending project match not found");

    return { ok: true, id, status: "rejected" };
  }

  private clampNumber(value: any, fallback: number, min: number, max: number): number {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(number)));
  }
}
