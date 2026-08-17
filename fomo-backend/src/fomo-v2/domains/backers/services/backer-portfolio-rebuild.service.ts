import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { FomoV2BackerPortfolioHolding } from "../models";

export interface FomoV2BackerPortfolioRebuildOptions {
  write?: boolean;
  dryRun?: boolean;
  debug?: boolean;
  backerId?: string;
  backerSlug?: string;
  /** Keep false for automatic refreshes so a crash cannot empty the live view. */
  replaceExisting?: boolean;
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2BackerPortfolioRebuildResult {
  mode: "dry-run" | "write";
  targetBacker?: FomoV2BackerPortfolioTargetBacker;
  participantsScanned: number;
  holdingsWouldCreate: number;
  holdingsCreated: number;
  holdingsWithMarketData: number;
  holdingsWithoutMarketData: number;
  uniqueBackers: number;
  uniqueProjects: number;
  uniqueProjectsWithMarketData: number;
  uniqueProjectsWithoutMarketData: number;
  sourcePairs: number;
  holdingPairs: number;
  missingPairs: number;
  holdingsDeleted?: number;
  quality: FomoV2BackerPortfolioQualitySummary;
  debugExamples?: FomoV2BackerPortfolioDebugExamples;
  missingPairExamples?: Array<Record<string, any>>;
  portfolioReport?: FomoV2BackerPortfolioReport;
  errors: Array<Record<string, any>>;
}

export interface FomoV2BackerPortfolioTargetBacker {
  backerId: string;
  name?: string;
  slug?: string;
  backerType?: string;
}

export interface FomoV2BackerPortfolioQualitySummary {
  duplicateProjectEntries: number;
  missingCanonicalProjectId: number;
  missingRoundIds: number;
  missingParticipantIds: number;
}

export interface FomoV2BackerPortfolioDebugExamples {
  holdingsWithoutMarketData: Array<Record<string, any>>;
}

export interface FomoV2BackerPortfolioReport {
  backer: string;
  backerId: string;
  slug?: string;
  projectsCount: number;
  projectsWithMarketData: number;
  projectsWithoutMarketData: number;
  quality: FomoV2BackerPortfolioQualitySummary;
  projects: Array<Record<string, any>>;
}

interface JoinedParticipantRow {
  _id: Types.ObjectId;
  fundingRoundId: Types.ObjectId;
  backerId: Types.ObjectId;
  canonicalProjectId: Types.ObjectId;
  isLead?: boolean;
  round?: Record<string, any>;
  backer?: Record<string, any>;
  project?: Record<string, any>;
  market?: Record<string, any>;
}

interface HoldingAccumulator {
  backerId: Types.ObjectId;
  canonicalProjectId: Types.ObjectId;
  roundIds: Map<string, Types.ObjectId>;
  participantIds: Map<string, Types.ObjectId>;
  leadRoundIds: Map<string, Types.ObjectId>;
  roundTypes: Set<string>;
  sourceTypes: Set<string>;
  sourceFeeds: Set<string>;
  raisedAmountsByRound: Map<string, number>;
  firstRoundDate?: Date;
  lastRoundDate?: Date;
  backerName?: string;
  backerType?: string;
  projectName?: string;
  projectSlug?: string;
  projectSymbol?: string;
  projectLogoUrl?: string;
  hasMarketData?: boolean;
  marketAssetId?: Types.ObjectId;
}

interface SourcePairSummary {
  backerId: string;
  canonicalProjectId: string;
}

const BULK_WRITE_CHUNK_SIZE = 1000;
const DEBUG_EXAMPLE_LIMIT = 10;

@Injectable()
export class FomoV2BackerPortfolioRebuildService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(FomoV2BackerPortfolioHolding.name)
    private readonly holdingModel: Model<FomoV2BackerPortfolioHolding>
  ) {}

  async run(
    options: FomoV2BackerPortfolioRebuildOptions = {}
  ): Promise<FomoV2BackerPortfolioRebuildResult> {
    const write = Boolean(options.write);
    const debug = Boolean(options.debug);
    await options.assertExecutionActive?.();
    const targetBacker = await this.resolveTargetBacker(options);
    const errors: Array<Record<string, any>> = [];
    const holdings = new Map<string, HoldingAccumulator>();
    let participantsScanned = 0;

    const participantFilter: Record<string, any> = {
      fundingRoundId: { $exists: true, $ne: null },
      backerId: { $exists: true, $ne: null },
      canonicalProjectId: { $exists: true, $ne: null },
    };
    if (targetBacker) {
      participantFilter.backerId = this.requireObjectId(
        targetBacker.backerId,
        "backerId"
      );
    }

    const participants = (await this.connection
      .collection("funding_round_participants")
      .find(
        participantFilter,
        {
          projection: {
            _id: 1,
            fundingRoundId: 1,
            backerId: 1,
            canonicalProjectId: 1,
            isLead: 1,
          },
        }
      )
      .toArray()) as JoinedParticipantRow[];
    const sourcePairs = this.buildSourcePairs(participants);

    const roundsById = await this.fetchByIds(
      "funding_rounds",
      participants.map((row) => row.fundingRoundId),
      {
        _id: 1,
        announcedDate: 1,
        date: 1,
        normalizedRoundType: 1,
        roundType: 1,
        raisedAmount: 1,
        primarySource: 1,
        sourceType: 1,
        sourceFeed: 1,
      }
    );
    const backersById = await this.fetchByIds(
      "backers",
      participants.map((row) => row.backerId),
      { _id: 1, name: 1, backerType: 1 }
    );
    const projectsById = await this.fetchByIds(
      "canonical_projects",
      participants.map((row) => row.canonicalProjectId),
      {
        _id: 1,
        name: 1,
        slug: 1,
        symbol: 1,
        hasMarketData: 1,
        "metadata.logoUrl": 1,
      }
    );
    const marketsByProjectId = await this.fetchMarketReadModels(
      participants.map((row) => row.canonicalProjectId)
    );
    await options.assertExecutionActive?.();

    for (const participant of participants) {
      if (participantsScanned % 250 === 0) {
        await options.assertExecutionActive?.();
      }
      participantsScanned += 1;
      try {
        const row = {
          ...participant,
          round: roundsById.get(this.idString(participant.fundingRoundId)),
          backer: backersById.get(this.idString(participant.backerId)),
          project: projectsById.get(this.idString(participant.canonicalProjectId)),
          market: marketsByProjectId.get(
            this.idString(participant.canonicalProjectId)
          ),
        };
        if (!row.round || !row.backer || !row.project) {
          errors.push({
            participantId: this.idString(row._id),
            fundingRoundId: this.idString(row.fundingRoundId),
            backerId: this.idString(row.backerId),
            canonicalProjectId: this.idString(row.canonicalProjectId),
            message: "Skipping dangling participant relation.",
          });
          continue;
        }
        this.addRow(holdings, row);
      } catch (error: any) {
        errors.push({
          participantId: this.idString(participant?._id),
          message: error?.message || String(error),
        });
      }
    }

    const payloads = Array.from(holdings.values()).map((holding) =>
      this.toPayload(holding)
    );
    const holdingPairKeys = new Set(payloads.map((payload) => this.pairKey(payload)));
    const missingPairExamples = this.buildMissingPairExamples(
      sourcePairs,
      holdingPairKeys
    );
    const marketSummary = this.buildMarketSummary(payloads);
    const quality = this.buildQualitySummary(payloads);
    const uniqueBackers = new Set(
      payloads.map((payload) => this.idString(payload.backerId))
    ).size;
    const uniqueProjects = new Set(
      payloads.map((payload) => this.idString(payload.canonicalProjectId))
    ).size;

    const result: FomoV2BackerPortfolioRebuildResult = {
      mode: write ? "write" : "dry-run",
      targetBacker,
      participantsScanned,
      holdingsWouldCreate: payloads.length,
      holdingsCreated: 0,
      holdingsWithMarketData: marketSummary.holdingsWithMarketData,
      holdingsWithoutMarketData: marketSummary.holdingsWithoutMarketData,
      uniqueBackers,
      uniqueProjects,
      uniqueProjectsWithMarketData: marketSummary.uniqueProjectsWithMarketData,
      uniqueProjectsWithoutMarketData:
        marketSummary.uniqueProjectsWithoutMarketData,
      sourcePairs: sourcePairs.size,
      holdingPairs: holdingPairKeys.size,
      missingPairs: missingPairExamples.length,
      quality,
      debugExamples: debug ? this.buildDebugExamples(payloads) : undefined,
      missingPairExamples: debug
        ? missingPairExamples.slice(0, DEBUG_EXAMPLE_LIMIT)
        : undefined,
      portfolioReport: targetBacker
        ? this.buildPortfolioReport(targetBacker, payloads, quality)
        : undefined,
      errors,
    };

    if (!write) return result;

    await options.assertExecutionActive?.();
    await this.holdingModel.createIndexes();
    await options.assertExecutionActive?.();
    const replaceExisting = options.replaceExisting !== false;
    if (replaceExisting) {
      const deleteFilter = targetBacker
        ? {
            backerId: this.requireObjectId(targetBacker.backerId, "backerId"),
          }
        : {};
      await options.assertExecutionActive?.();
      const deleted = await this.holdingModel.deleteMany(deleteFilter);
      await options.assertExecutionActive?.();
      result.holdingsDeleted = Number(deleted.deletedCount || 0);
    } else {
      result.holdingsDeleted = 0;
    }

    for (let index = 0; index < payloads.length; index += BULK_WRITE_CHUNK_SIZE) {
      const chunk = payloads.slice(index, index + BULK_WRITE_CHUNK_SIZE);
      if (!chunk.length) continue;
      await options.assertExecutionActive?.();
      const written = await (this.holdingModel as any).bulkWrite(
        chunk.map((payload) =>
          replaceExisting
            ? {
                insertOne: {
                  document: payload,
                },
              }
            : {
                updateOne: {
                  filter: {
                    backerId: payload.backerId,
                    canonicalProjectId: payload.canonicalProjectId,
                  },
                  update: { $set: payload },
                  upsert: true,
                },
              }
        ),
        { ordered: false }
      );
      await options.assertExecutionActive?.();
      result.holdingsCreated += replaceExisting
        ? Number(written.insertedCount || 0)
        : Number(written.upsertedCount || 0) +
          Number(written.modifiedCount || 0);
    }

    return result;
  }

  private async resolveTargetBacker(
    options: FomoV2BackerPortfolioRebuildOptions
  ): Promise<FomoV2BackerPortfolioTargetBacker | undefined> {
    const backerId = cleanString(options.backerId);
    const backerSlug = cleanString(options.backerSlug);
    if (backerId && backerSlug) {
      throw new Error("Use either --backer or --backer-slug, not both.");
    }
    if (!backerId && !backerSlug) return undefined;

    if (backerId) {
      const objectId = this.requireObjectId(backerId, "backerId");
      const backer = await this.connection.collection("backers").findOne(
        { _id: objectId },
        { projection: { _id: 1, name: 1, slug: 1, backerType: 1 } }
      );
      if (!backer) {
        throw new Error(`Backer not found for id ${backerId}.`);
      }
      return this.toTargetBacker(backer);
    }

    const backers = await this.connection
      .collection("backers")
      .find(
        { slug: backerSlug },
        {
          projection: { _id: 1, name: 1, slug: 1, backerType: 1 },
          sort: { updatedAt: -1 },
        }
      )
      .toArray();
    if (backers.length === 1) return this.toTargetBacker(backers[0]);
    if (backers.length > 1) {
      throw new Error(
        `Backer slug ${backerSlug} matched ${backers.length} backers. Use --backer=<id>.`
      );
    }

    const readModels = await this.connection
      .collection("backer_read_models")
      .find(
        { slug: backerSlug },
        {
          projection: {
            _id: 1,
            backerId: 1,
            name: 1,
            slug: 1,
            backerType: 1,
          },
          sort: { updatedAt: -1 },
        }
      )
      .toArray();
    const uniqueBackerIds = this.uniqueObjectIds(
      readModels.map((row) => row.backerId)
    );
    if (uniqueBackerIds.length === 1) {
      const backer = await this.connection.collection("backers").findOne(
        { _id: uniqueBackerIds[0] },
        { projection: { _id: 1, name: 1, slug: 1, backerType: 1 } }
      );
      return this.toTargetBacker(backer || readModels[0]);
    }
    if (uniqueBackerIds.length > 1) {
      throw new Error(
        `Backer slug ${backerSlug} matched ${uniqueBackerIds.length} read models. Use --backer=<id>.`
      );
    }

    throw new Error(`Backer not found for slug ${backerSlug}.`);
  }

  private toTargetBacker(row: any): FomoV2BackerPortfolioTargetBacker {
    const backerId = this.idString(row?._id || row?.backerId);
    if (!backerId) throw new Error("Resolved backer is missing _id.");
    return cleanObject({
      backerId,
      name: cleanString(row?.name),
      slug: cleanString(row?.slug),
      backerType: cleanString(row?.backerType),
    }) as FomoV2BackerPortfolioTargetBacker;
  }

  private buildSourcePairs(
    participants: JoinedParticipantRow[]
  ): Map<string, SourcePairSummary> {
    const output = new Map<string, SourcePairSummary>();
    for (const participant of participants) {
      const backerId = this.idString(participant.backerId);
      const canonicalProjectId = this.idString(participant.canonicalProjectId);
      if (!backerId || !canonicalProjectId) continue;
      const key = `${backerId}:${canonicalProjectId}`;
      if (!output.has(key)) output.set(key, { backerId, canonicalProjectId });
    }
    return output;
  }

  private buildMissingPairExamples(
    sourcePairs: Map<string, SourcePairSummary>,
    holdingPairKeys: Set<string>
  ): Array<Record<string, any>> {
    return Array.from(sourcePairs.entries())
      .filter(([key]) => !holdingPairKeys.has(key))
      .map(([, pair]) => pair);
  }

  private buildMarketSummary(payloads: Array<Record<string, any>>): {
    holdingsWithMarketData: number;
    holdingsWithoutMarketData: number;
    uniqueProjectsWithMarketData: number;
    uniqueProjectsWithoutMarketData: number;
  } {
    const projectsWithMarket = new Set<string>();
    const projectsWithoutMarket = new Set<string>();
    let holdingsWithMarketData = 0;
    let holdingsWithoutMarketData = 0;

    for (const payload of payloads) {
      const projectId = this.idString(payload.canonicalProjectId);
      const hasMarketData = this.hasMarketData(payload);
      if (hasMarketData) {
        holdingsWithMarketData += 1;
        if (projectId) projectsWithMarket.add(projectId);
      } else {
        holdingsWithoutMarketData += 1;
        if (projectId) projectsWithoutMarket.add(projectId);
      }
    }

    return {
      holdingsWithMarketData,
      holdingsWithoutMarketData,
      uniqueProjectsWithMarketData: projectsWithMarket.size,
      uniqueProjectsWithoutMarketData: projectsWithoutMarket.size,
    };
  }

  private buildQualitySummary(
    payloads: Array<Record<string, any>>
  ): FomoV2BackerPortfolioQualitySummary {
    const pairCounts = new Map<string, number>();
    let missingCanonicalProjectId = 0;
    let missingRoundIds = 0;
    let missingParticipantIds = 0;

    for (const payload of payloads) {
      const key = this.pairKey(payload);
      if (key) pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      if (!this.idString(payload.canonicalProjectId)) {
        missingCanonicalProjectId += 1;
      }
      if (!Array.isArray(payload.roundIds) || !payload.roundIds.length) {
        missingRoundIds += 1;
      }
      if (
        !Array.isArray(payload.participantIds) ||
        !payload.participantIds.length
      ) {
        missingParticipantIds += 1;
      }
    }

    const duplicateProjectEntries = Array.from(pairCounts.values()).filter(
      (count) => count > 1
    ).length;

    return {
      duplicateProjectEntries,
      missingCanonicalProjectId,
      missingRoundIds,
      missingParticipantIds,
    };
  }

  private buildDebugExamples(
    payloads: Array<Record<string, any>>
  ): FomoV2BackerPortfolioDebugExamples {
    return {
      holdingsWithoutMarketData: payloads
        .filter((payload) => !this.hasMarketData(payload))
        .slice(0, DEBUG_EXAMPLE_LIMIT)
        .map((payload) => ({
          backer: cleanString(payload.backerName),
          backerId: this.idString(payload.backerId),
          canonicalProjectId: this.idString(payload.canonicalProjectId),
          projectName: cleanString(payload.projectName),
          projectSlug: cleanString(payload.projectSlug),
          projectSymbol: cleanString(payload.projectSymbol),
          hasMarketData: false,
        })),
    };
  }

  private buildPortfolioReport(
    targetBacker: FomoV2BackerPortfolioTargetBacker,
    payloads: Array<Record<string, any>>,
    quality: FomoV2BackerPortfolioQualitySummary
  ): FomoV2BackerPortfolioReport {
    const projects = payloads
      .slice()
      .sort((left, right) =>
        String(left.projectName || "").localeCompare(String(right.projectName || ""))
      )
      .map((payload) => ({
        projectName: cleanString(payload.projectName),
        projectSlug: cleanString(payload.projectSlug),
        projectSymbol: cleanString(payload.projectSymbol),
        hasMarketData: this.hasMarketData(payload),
        roundsCount: Number(payload.roundsCount || 0),
        leadRoundsCount: Number(payload.leadRoundsCount || 0),
        firstRoundDate: this.dateString(payload.firstRoundDate),
        lastRoundDate: this.dateString(payload.lastRoundDate),
        roundTypes: Array.isArray(payload.roundTypes) ? payload.roundTypes : [],
      }));

    const projectsWithMarketData = projects.filter(
      (project) => project.hasMarketData
    ).length;

    return {
      backer: targetBacker.name || targetBacker.backerId,
      backerId: targetBacker.backerId,
      slug: targetBacker.slug,
      projectsCount: projects.length,
      projectsWithMarketData,
      projectsWithoutMarketData: projects.length - projectsWithMarketData,
      quality,
      projects,
    };
  }

  private hasMarketData(payload: Record<string, any>): boolean {
    return Boolean(payload.hasMarketData || payload.marketAssetId);
  }

  private pairKey(payload: Record<string, any>): string {
    const backerId = this.idString(payload.backerId);
    const canonicalProjectId = this.idString(payload.canonicalProjectId);
    return backerId && canonicalProjectId
      ? `${backerId}:${canonicalProjectId}`
      : "";
  }

  private addRow(
    holdings: Map<string, HoldingAccumulator>,
    row: JoinedParticipantRow
  ): void {
    const backerId = this.requireObjectId(row.backerId, "backerId");
    const canonicalProjectId = this.requireObjectId(
      row.canonicalProjectId,
      "canonicalProjectId"
    );
    const fundingRoundId = this.requireObjectId(
      row.fundingRoundId || row.round?._id,
      "fundingRoundId"
    );
    const participantId = this.requireObjectId(row._id, "participantId");
    const key = `${this.idString(backerId)}:${this.idString(canonicalProjectId)}`;
    const holding =
      holdings.get(key) ||
      this.emptyHolding(backerId, canonicalProjectId, row);

    holding.roundIds.set(this.idString(fundingRoundId), fundingRoundId);
    holding.participantIds.set(this.idString(participantId), participantId);
    if (row.isLead) {
      holding.leadRoundIds.set(this.idString(fundingRoundId), fundingRoundId);
    }

    const roundType = cleanString(
      row.round?.normalizedRoundType || row.round?.roundType
    );
    if (roundType) holding.roundTypes.add(roundType);

    for (const sourceType of [
      cleanString(row.round?.sourceType),
      cleanString(row.round?.primarySource),
    ]) {
      if (sourceType) holding.sourceTypes.add(sourceType);
    }

    const sourceFeed = cleanString(row.round?.sourceFeed);
    if (sourceFeed) holding.sourceFeeds.add(sourceFeed);

    const roundDate = this.roundDate(row.round);
    if (roundDate) {
      if (!holding.firstRoundDate || roundDate < holding.firstRoundDate) {
        holding.firstRoundDate = roundDate;
      }
      if (!holding.lastRoundDate || roundDate > holding.lastRoundDate) {
        holding.lastRoundDate = roundDate;
      }
    }

    const raisedAmount = this.numberValue(row.round?.raisedAmount);
    if (raisedAmount !== undefined) {
      holding.raisedAmountsByRound.set(this.idString(fundingRoundId), raisedAmount);
    }

    holdings.set(key, holding);
  }

  private emptyHolding(
    backerId: Types.ObjectId,
    canonicalProjectId: Types.ObjectId,
    row: JoinedParticipantRow
  ): HoldingAccumulator {
    const marketAssetId = this.toObjectId(row.market?.marketAssetId);
    return {
      backerId,
      canonicalProjectId,
      roundIds: new Map(),
      participantIds: new Map(),
      leadRoundIds: new Map(),
      roundTypes: new Set(),
      sourceTypes: new Set(),
      sourceFeeds: new Set(),
      raisedAmountsByRound: new Map(),
      backerName: cleanString(row.backer?.name),
      backerType: cleanString(row.backer?.backerType),
      projectName: cleanString(row.project?.name),
      projectSlug: cleanString(row.project?.slug),
      projectSymbol: cleanString(row.project?.symbol),
      projectLogoUrl:
        cleanString(row.market?.logo) || cleanString(row.project?.metadata?.logoUrl),
      hasMarketData: Boolean(row.project?.hasMarketData || marketAssetId),
      marketAssetId,
    };
  }

  private toPayload(holding: HoldingAccumulator): Record<string, any> {
    const roundIds = Array.from(holding.roundIds.values());
    const participantIds = Array.from(holding.participantIds.values());
    const leadRoundIds = Array.from(holding.leadRoundIds.values());
    const totalKnownRaisedAmountUsd = Array.from(
      holding.raisedAmountsByRound.values()
    ).reduce((sum, amount) => sum + amount, 0);

    return cleanObject({
      backerId: holding.backerId,
      canonicalProjectId: holding.canonicalProjectId,
      roundIds,
      participantIds,
      firstRoundDate: holding.firstRoundDate,
      lastRoundDate: holding.lastRoundDate,
      roundTypes: Array.from(holding.roundTypes).sort(),
      isLead: leadRoundIds.length > 0,
      leadRoundIds,
      roundsCount: roundIds.length,
      leadRoundsCount: leadRoundIds.length,
      totalKnownRaisedAmountUsd:
        totalKnownRaisedAmountUsd > 0 ? totalKnownRaisedAmountUsd : undefined,
      backerName: holding.backerName,
      backerType: holding.backerType,
      projectName: holding.projectName,
      projectSlug: holding.projectSlug,
      projectSymbol: holding.projectSymbol,
      projectLogoUrl: holding.projectLogoUrl,
      hasMarketData: Boolean(holding.hasMarketData),
      marketAssetId: holding.marketAssetId,
      sourceTypes: Array.from(holding.sourceTypes).sort(),
      sourceFeeds: Array.from(holding.sourceFeeds).sort(),
      updatedAt: new Date(),
    });
  }

  private async fetchByIds(
    collectionName: string,
    ids: any[],
    projection: Record<string, 0 | 1>
  ): Promise<Map<string, Record<string, any>>> {
    const output = new Map<string, Record<string, any>>();
    const uniqueIds = this.uniqueObjectIds(ids);
    for (let index = 0; index < uniqueIds.length; index += BULK_WRITE_CHUNK_SIZE) {
      const chunk = uniqueIds.slice(index, index + BULK_WRITE_CHUNK_SIZE);
      const rows = await this.connection
        .collection(collectionName)
        .find({ _id: { $in: chunk } }, { projection })
        .toArray();
      for (const row of rows) output.set(this.idString(row._id), row);
    }
    return output;
  }

  private async fetchMarketReadModels(
    canonicalProjectIds: any[]
  ): Promise<Map<string, Record<string, any>>> {
    const output = new Map<string, Record<string, any>>();
    const uniqueIds = this.uniqueObjectIds(canonicalProjectIds);
    for (let index = 0; index < uniqueIds.length; index += BULK_WRITE_CHUNK_SIZE) {
      const chunk = uniqueIds.slice(index, index + BULK_WRITE_CHUNK_SIZE);
      const rows = await this.connection
        .collection("market_project_read_models")
        .find(
          { canonicalProjectId: { $in: chunk } },
          {
            projection: {
              _id: 1,
              canonicalProjectId: 1,
              marketAssetId: 1,
              logo: 1,
              updatedAt: 1,
            },
            sort: { updatedAt: -1 },
          }
        )
        .toArray();
      for (const row of rows) {
        const key = this.idString(row.canonicalProjectId);
        if (!output.has(key)) output.set(key, row);
      }
    }
    return output;
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const output = new Map<string, Types.ObjectId>();
    for (const value of values) {
      const objectId = this.toObjectId(value);
      if (objectId) output.set(this.idString(objectId), objectId);
    }
    return Array.from(output.values());
  }

  private roundDate(round: Record<string, any> | undefined): Date | undefined {
    const value = round?.announcedDate || round?.date;
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private dateString(value: any): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? undefined
      : date.toISOString().slice(0, 10);
  }

  private numberValue(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private requireObjectId(value: any, field: string): Types.ObjectId {
    const objectId = this.toObjectId(value);
    if (!objectId) throw new Error(`Invalid ${field} ObjectId value.`);
    return objectId;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = this.idString(value);
    return Types.ObjectId.isValid(text) ? new Types.ObjectId(text) : undefined;
  }

  private idString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
  }
}

function cleanString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function cleanObject(input: Record<string, any>): Record<string, any> {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output;
}
