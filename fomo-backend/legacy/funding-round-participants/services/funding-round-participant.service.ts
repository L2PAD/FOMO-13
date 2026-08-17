import { Injectable, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FundingRound } from "src/funding-rounds/models/funding-round.model";
import {
  FundingRoundParticipant,
  FundingRoundParticipantAllocationMethod,
  FundingRoundParticipantMatchStatus,
} from "../models/funding-round-participant.model";
import {
  FundingRoundParticipantAuditLog,
  FundingRoundParticipantAuditOperation,
} from "../models/funding-round-participant-audit-log.model";
import {
  FundingRoundParticipantResolution,
  FundingRoundParticipantResolverService,
} from "./funding-round-participant-resolver.service";
import { InvestorCandidateService } from "src/investor-candidates/investor-candidates.service";

export type FundingRoundParticipantBackfillOptions = {
  dryRun?: boolean;
  apply?: boolean;
  confirmApply?: boolean;
  writeAuditLogs?: boolean;
  scanLimit?: number;
  roundId?: string;
  progressEvery?: number;
  concurrency?: number;
};

export type FundingRoundParticipantBackfillSummary = {
  mode: "dry-run" | "apply";
  startedAt: string;
  finishedAt?: string;
  scannedRounds: number;
  rawInvestorsScanned: number;
  wouldCreate: number;
  verified: number;
  proposed: number;
  conflicts: number;
  unmatched: number;
  withCanonicalProject: number;
  withoutCanonicalProject: number;
  fundMatches: number;
  personMatches: number;
  investorCandidateMatches: number;
  investorCandidates: {
    wouldCreate: number;
    wouldMergeEvidence: number;
    byStatus: Record<string, number>;
    examples: {
      created: any[];
      mergedEvidence: any[];
    };
  };
  examples: {
    verified: any[];
    proposed: any[];
    conflicts: any[];
    unmatched: any[];
  };
  warnings: string[];
};

type FundingRoundParticipantWriteCache = {
  existingKeys: Set<string>;
};

@Injectable()
export class FundingRoundParticipantService {
  constructor(
    @InjectModel(FundingRoundParticipant.name)
    private readonly participantModel: Model<FundingRoundParticipant>,
    @InjectModel(FundingRoundParticipantAuditLog.name)
    private readonly auditLogModel: Model<FundingRoundParticipantAuditLog>,
    @InjectModel(FundingRound.name)
    private readonly fundingRoundModel: Model<FundingRound>,
    private readonly resolverService: FundingRoundParticipantResolverService,
    @Optional()
    private readonly investorCandidateService?: InvestorCandidateService,
  ) {}

  async runBackfill(options: FundingRoundParticipantBackfillOptions = {}): Promise<FundingRoundParticipantBackfillSummary> {
    const dryRun = this.resolveDryRunMode(options);
    const writeAuditLogs = this.resolveWriteAuditLogs(options, dryRun);
    const summary = this.createSummary(dryRun);
    const rounds = await this.listFundingRounds(options);
    const progressEvery = this.normalizeProgressEvery(options.progressEvery);
    const concurrency = this.normalizeConcurrency(options.concurrency);
    this.logProgress(
      `loaded ${rounds.length} funding rounds; preloading fund/person investor candidate indexes`,
    );
    const resolverCache =
      typeof (this.resolverService as any).buildBatchCache === "function"
        ? await this.resolverService.buildBatchCache(rounds as any[])
        : undefined;
    const investorCandidateDryRunCache = new Map<string, any>();
    const participantWriteCache =
      !dryRun && !writeAuditLogs ? await this.buildParticipantWriteCache(rounds as any[]) : undefined;

    this.logProgress(
      `plan mode=${summary.mode} scanLimit=${options.scanLimit ?? "all"} roundId=${options.roundId || "all"} progressEvery=${progressEvery} concurrency=${concurrency} writeAuditLogs=${writeAuditLogs}`,
    );

    const startedAtMs = Date.now();
    let processed = 0;

    const processRound = async (round: any) => {
      summary.scannedRounds += 1;
      const resolution = await this.resolverService.resolveRound(round as any, resolverCache);
      summary.rawInvestorsScanned += resolution.rawInvestorsScanned;

      const participantsWithCandidates: FundingRoundParticipantResolution[] = [];
      for (const participant of resolution.participants) {
        const participantWithCandidate = await this.ensureInvestorCandidate(participant, { dryRun, dryRunCache: investorCandidateDryRunCache }, summary);
        participantsWithCandidates.push(participantWithCandidate);
      }

      if (participantWriteCache) {
        summary.wouldCreate += await this.ensureParticipantsBatch(participantsWithCandidates, participantWriteCache);
        for (const participant of participantsWithCandidates) {
          this.countParticipant(summary, participant);
          this.addExample(summary, participant);
        }
      } else {
        for (const participant of participantsWithCandidates) {
          const ensureResult = await this.ensureParticipant(participant, { dryRun, writeAuditLogs });
          if (ensureResult.created || ensureResult.wouldCreate) summary.wouldCreate += 1;
          this.countParticipant(summary, participant);
          this.addExample(summary, participant);
        }
      }

      processed += 1;
      this.logEntityProgress(processed, rounds.length, startedAtMs, summary, progressEvery);
    };

    if (concurrency <= 1 || rounds.length <= 1) {
      for (let index = 0; index < rounds.length; index += 1) {
        await processRound(rounds[index]);
      }
    } else {
      let nextIndex = 0;
      const workerCount = Math.min(concurrency, rounds.length);
      const workers = Array.from({ length: workerCount }, async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= rounds.length) return;
          await processRound(rounds[index]);
        }
      });
      await Promise.all(workers);
    }

    summary.finishedAt = new Date().toISOString();
    return summary;
  }

  async ensureParticipant(input: FundingRoundParticipantResolution, options: { dryRun?: boolean; writeAuditLogs?: boolean } = {}) {
    const fundingRoundId = this.toObjectId(input.fundingRoundId);
    if (!fundingRoundId) return { status: "skipped", reason: "Missing fundingRoundId.", linksCreated: 0 };

    const payload = this.participantPayload(input, fundingRoundId);
    const existing = options.dryRun ? null : await this.participantModel.findOne(this.idempotencyQuery(payload)).lean();
    if (existing) return { status: existing.matchStatus, participant: existing, created: false, idempotent: true };

    if (options.dryRun) {
      return {
        status: payload.matchStatus,
        participant: { _id: new Types.ObjectId(), ...payload, __dryRun: true },
        wouldCreate: true,
        dryRun: true,
      };
    }

    const created = await this.participantModel.create(payload);
    const createdObject = typeof (created as any).toObject === "function" ? (created as any).toObject() : created;
    if (options.writeAuditLogs) {
      await this.writeAudit({
        operation: this.auditOperationForStatus(payload.matchStatus),
        participantId: createdObject._id,
        fundingRoundId: payload.fundingRoundId,
        canonicalProjectId: payload.canonicalProjectId,
        fundId: payload.fundId,
        personId: payload.personId,
        after: createdObject,
        confidence: payload.confidence,
        matchedBy: payload.matchedBy,
        reason: input.reason,
        dryRun: false,
        status: payload.matchStatus === "conflict" ? "conflict" : "success",
      });
    }

    return { status: payload.matchStatus, participant: createdObject, created: true };
  }

  private async ensureParticipantsBatch(
    inputs: FundingRoundParticipantResolution[],
    writeCache: FundingRoundParticipantWriteCache,
  ): Promise<number> {
    if (!inputs.length) return 0;

    const toInsert: any[] = [];
    for (const input of inputs) {
      const fundingRoundId = this.toObjectId(input.fundingRoundId);
      if (!fundingRoundId) continue;

      const payload = this.participantPayload(input, fundingRoundId);
      const key = this.idempotencyKey(payload);
      if (writeCache.existingKeys.has(key)) continue;

      writeCache.existingKeys.add(key);
      toInsert.push(payload);
    }

    if (!toInsert.length) return 0;

    await this.participantModel.insertMany(toInsert, { ordered: false });
    return toInsert.length;
  }

  private async ensureInvestorCandidate(
    participant: FundingRoundParticipantResolution,
    options: { dryRun?: boolean; dryRunCache?: Map<string, any> },
    summary: FundingRoundParticipantBackfillSummary,
  ): Promise<FundingRoundParticipantResolution> {
    if (participant.matchStatus !== "unmatched" || participant.fundId || participant.personId) return participant;
    if (!this.investorCandidateService) {
      summary.warnings.push("InvestorCandidateService is not registered; unmatched investor was left without candidate.");
      return participant;
    }

    const result = await this.investorCandidateService.proposeCandidate(
      {
        name: participant.sourceInvestorName,
        slug: participant.sourceInvestorSlug,
        source: participant.source,
        sourceInvestorId: participant.sourceInvestorId,
        sourceInvestorSlug: participant.sourceInvestorSlug,
        candidateType: "unknown",
        evidenceType: "fundingRound",
        evidenceEntityId: participant.fundingRoundId,
        fundingRoundId: participant.fundingRoundId,
        canonicalProjectId: participant.canonicalProjectId,
        role: participant.role,
        status: "new",
        confidence: 0,
        matchedBy: "none",
        reason: participant.reason || "No Fund or Person matched this funding round investor.",
        rawEvidence: participant.rawInvestor,
        raw: participant.rawInvestor,
      },
      options,
    );

    const candidate = result.candidate || {};
    const investorCandidateId = this.toObjectId(candidate._id);
    if (result.wouldCreate || result.created) {
      summary.investorCandidates.wouldCreate += 1;
      this.pushInvestorCandidateExample(summary.investorCandidates.examples.created, candidate, participant);
    } else if (result.wouldMergeEvidence || result.mergedEvidence) {
      summary.investorCandidates.wouldMergeEvidence += 1;
      this.pushInvestorCandidateExample(summary.investorCandidates.examples.mergedEvidence, candidate, participant);
    }

    const status = candidate.status || "new";
    summary.investorCandidates.byStatus[status] = (summary.investorCandidates.byStatus[status] || 0) + 1;

    return {
      ...participant,
      investorCandidateId,
    };
  }

  private async buildParticipantWriteCache(rounds: any[]): Promise<FundingRoundParticipantWriteCache> {
    const roundIds = this.uniqueObjectIds((rounds || []).map((round) => round?._id));
    if (!roundIds.length) return { existingKeys: new Set() };

    const existingParticipants = await this.participantModel
      .find({ fundingRoundId: { $in: roundIds } })
      .select({
        fundingRoundId: 1,
        fundId: 1,
        personId: 1,
        investorCandidateId: 1,
        sourceInvestorSlug: 1,
        sourceInvestorId: 1,
        sourceInvestorName: 1,
      })
      .lean();

    const existingKeys = new Set<string>();
    for (const participant of existingParticipants || []) {
      existingKeys.add(this.idempotencyKey(participant));
    }
    this.logProgress(`preloaded existing participant idempotency keys=${existingKeys.size}`);

    return { existingKeys };
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const seen = new Set<string>();
    const ids: Types.ObjectId[] = [];
    for (const value of values || []) {
      const objectId = this.toObjectId(value);
      if (!objectId) continue;
      const key = String(objectId);
      if (seen.has(key)) continue;
      seen.add(key);
      ids.push(objectId);
    }
    return ids;
  }

  async getCoverageStats() {
    const [
      participants,
      verified,
      proposed,
      conflicts,
      unmatched,
      withCanonicalProject,
      withoutCanonicalProject,
      fundMatches,
      personMatches,
      investorCandidateMatches,
      roundsWithParticipants,
    ] = await Promise.all([
      this.participantModel.countDocuments({}),
      this.participantModel.countDocuments({ matchStatus: "verified" }),
      this.participantModel.countDocuments({ matchStatus: "proposed" }),
      this.participantModel.countDocuments({ matchStatus: "conflict" }),
      this.participantModel.countDocuments({ matchStatus: "unmatched" }),
      this.participantModel.countDocuments({ canonicalProjectId: { $exists: true, $ne: null } }),
      this.participantModel.countDocuments({ $or: [{ canonicalProjectId: null }, { canonicalProjectId: { $exists: false } }] }),
      this.participantModel.countDocuments({ fundId: { $exists: true, $ne: null } }),
      this.participantModel.countDocuments({ personId: { $exists: true, $ne: null } }),
      this.participantModel.countDocuments({ investorCandidateId: { $exists: true, $ne: null } }),
      this.participantModel.distinct("fundingRoundId"),
    ]);

    return {
      participants,
      verified,
      proposed,
      conflicts,
      unmatched,
      withCanonicalProject,
      withoutCanonicalProject,
      fundMatches,
      personMatches,
      investorCandidateMatches,
      roundsWithParticipants: roundsWithParticipants.length,
      byAllocationMethod: await this.countByField("allocationMethod"),
      byRole: await this.countByField("role"),
    };
  }

  async getForRound(roundId: string) {
    const objectId = this.toObjectId(roundId);
    if (!objectId) return { roundId, participants: [] };
    return {
      roundId,
      participants: await this.participantModel.find({ fundingRoundId: objectId }).sort({ role: 1, confidence: -1 }).lean(),
    };
  }

  async getForFund(fundId: string) {
    const objectId = this.toObjectId(fundId);
    if (!objectId) return { fundId, participants: [] };
    return {
      fundId,
      participants: await this.participantModel.find({ fundId: objectId }).sort({ createdAt: -1 }).limit(500).lean(),
    };
  }

  async getForPerson(personId: string) {
    const objectId = this.toObjectId(personId);
    if (!objectId) return { personId, participants: [] };
    return {
      personId,
      participants: await this.participantModel.find({ personId: objectId }).sort({ createdAt: -1 }).limit(500).lean(),
    };
  }

  async getConflicts(limit = 100) {
    return this.participantModel
      .find({ matchStatus: "conflict" })
      .sort({ confidence: -1, updatedAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 500))
      .lean();
  }

  private async listFundingRounds(options: FundingRoundParticipantBackfillOptions) {
    const query: any = {};
    const objectId = this.toObjectId(options.roundId);
    if (objectId) query._id = objectId;
    else if (options.roundId) query.$or = [{ sourceKey: options.roundId }, { sourceId: options.roundId }, { roundId: options.roundId }];

    const chain = this.fundingRoundModel
      .find(query)
      .select({
        _id: 1,
        projectId: 1,
        projectLinks: 1,
        investors: 1,
        leadInvestors: 1,
        fundsRaised: 1,
        source: 1,
        sourceId: 1,
        sourceKey: 1,
        roundId: 1,
        id: 1,
        date: 1,
      })
      .sort({ date: -1, _id: 1 })
      .limit(options.scanLimit && options.scanLimit > 0 ? options.scanLimit : 1000)
      .lean();
    return chain;
  }

  private participantPayload(input: FundingRoundParticipantResolution, fundingRoundId: Types.ObjectId) {
    return {
      fundingRoundId,
      canonicalProjectId: this.toObjectId(input.canonicalProjectId),
      legacyProjectId: this.toObjectId(input.legacyProjectId),
      participantType: input.participantType || "unknown",
      fundId: this.toObjectId(input.fundId),
      personId: this.toObjectId(input.personId),
      investorCandidateId: this.toObjectId(input.investorCandidateId),
      role: input.role || "unknown",
      source: input.source,
      sourceInvestorId: input.sourceInvestorId,
      sourceInvestorSlug: input.sourceInvestorSlug,
      sourceInvestorName: input.sourceInvestorName,
      amountUsd: this.definedNumber(input.amountUsd),
      allocationMethod: input.allocationMethod || "unknown",
      confidence: Number(input.confidence) || 0,
      matchedBy: input.matchedBy || "none",
      matchStatus: input.matchStatus || "unmatched",
      rawInvestor: input.rawInvestor || null,
    };
  }

  private idempotencyQuery(payload: any) {
    const query: any = { fundingRoundId: payload.fundingRoundId };
    if (payload.fundId) query.fundId = payload.fundId;
    if (payload.personId) query.personId = payload.personId;
    if (payload.investorCandidateId) query.investorCandidateId = payload.investorCandidateId;
    if (payload.sourceInvestorSlug) query.sourceInvestorSlug = payload.sourceInvestorSlug;
    else if (payload.sourceInvestorId) query.sourceInvestorId = payload.sourceInvestorId;
    else if (payload.sourceInvestorName) query.sourceInvestorName = payload.sourceInvestorName;
    return query;
  }

  private idempotencyKey(payload: any): string {
    const investorKey = payload.sourceInvestorSlug || payload.sourceInvestorId || payload.sourceInvestorName || "";
    return [
      this.objectIdKey(payload.fundingRoundId),
      this.objectIdKey(payload.fundId),
      this.objectIdKey(payload.personId),
      this.objectIdKey(payload.investorCandidateId),
      String(investorKey),
    ].join("|");
  }

  private countParticipant(summary: FundingRoundParticipantBackfillSummary, participant: FundingRoundParticipantResolution) {
    if (participant.matchStatus === "verified") summary.verified += 1;
    else if (participant.matchStatus === "proposed") summary.proposed += 1;
    else if (participant.matchStatus === "conflict") summary.conflicts += 1;
    else summary.unmatched += 1;

    if (participant.canonicalProjectId) summary.withCanonicalProject += 1;
    else summary.withoutCanonicalProject += 1;
    if (participant.fundId) summary.fundMatches += 1;
    if (participant.personId) summary.personMatches += 1;
    if (participant.investorCandidateId) summary.investorCandidateMatches += 1;
  }

  private addExample(summary: FundingRoundParticipantBackfillSummary, participant: FundingRoundParticipantResolution) {
    const bucket =
      participant.matchStatus === "verified"
        ? summary.examples.verified
        : participant.matchStatus === "proposed"
          ? summary.examples.proposed
          : participant.matchStatus === "conflict"
            ? summary.examples.conflicts
            : summary.examples.unmatched;
    if (bucket.length >= 5) return;
    bucket.push({
      fundingRoundId: String(participant.fundingRoundId),
      canonicalProjectId: participant.canonicalProjectId ? String(participant.canonicalProjectId) : null,
      participantType: participant.participantType,
      fundId: participant.fundId ? String(participant.fundId) : null,
      personId: participant.personId ? String(participant.personId) : null,
      investorCandidateId: participant.investorCandidateId ? String(participant.investorCandidateId) : null,
      sourceInvestorId: participant.sourceInvestorId,
      sourceInvestorSlug: participant.sourceInvestorSlug,
      sourceInvestorName: participant.sourceInvestorName,
      role: participant.role,
      amountUsd: participant.amountUsd,
      allocationMethod: participant.allocationMethod,
      matchStatus: participant.matchStatus,
      confidence: participant.confidence,
      matchedBy: participant.matchedBy,
      reason: participant.reason,
    });
  }

  private pushInvestorCandidateExample(target: any[], candidate: any, participant: FundingRoundParticipantResolution) {
    if (target.length >= 5) return;
    target.push({
      investorCandidateId: candidate?._id ? String(candidate._id) : null,
      fundingRoundId: String(participant.fundingRoundId),
      canonicalProjectId: participant.canonicalProjectId ? String(participant.canonicalProjectId) : null,
      name: participant.sourceInvestorName,
      slug: participant.sourceInvestorSlug,
      source: participant.source,
      sourceInvestorId: participant.sourceInvestorId,
      role: participant.role,
      status: candidate?.status || "new",
      reason: candidate?.reason || participant.reason,
    });
  }

  private async countByField(field: string) {
    const rows = await this.participantModel.aggregate([
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.reduce((acc, row) => {
      acc[row._id || "unknown"] = row.count;
      return acc;
    }, {});
  }

  private createSummary(dryRun: boolean): FundingRoundParticipantBackfillSummary {
    return {
      mode: dryRun ? "dry-run" : "apply",
      startedAt: new Date().toISOString(),
      scannedRounds: 0,
      rawInvestorsScanned: 0,
      wouldCreate: 0,
      verified: 0,
      proposed: 0,
      conflicts: 0,
      unmatched: 0,
      withCanonicalProject: 0,
      withoutCanonicalProject: 0,
      fundMatches: 0,
      personMatches: 0,
      investorCandidateMatches: 0,
      investorCandidates: {
        wouldCreate: 0,
        wouldMergeEvidence: 0,
        byStatus: {},
        examples: {
          created: [],
          mergedEvidence: [],
        },
      },
      examples: {
        verified: [],
        proposed: [],
        conflicts: [],
        unmatched: [],
      },
      warnings: dryRun
        ? []
        : [
            "Apply mode requires --apply and --confirm-apply=true. Production/staging apply should be run as a separate reviewed task.",
            "FundingRoundParticipant audit-log writes are disabled by default for backfill apply.",
          ],
    };
  }

  private resolveDryRunMode(options: FundingRoundParticipantBackfillOptions): boolean {
    return !(options.apply && options.confirmApply === true);
  }

  private resolveWriteAuditLogs(options: FundingRoundParticipantBackfillOptions, dryRun: boolean): boolean {
    if (dryRun) return false;
    return options.writeAuditLogs === true;
  }

  private normalizeProgressEvery(value?: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 10;
    return Math.trunc(parsed);
  }

  private normalizeConcurrency(value?: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.min(25, Math.max(1, Math.trunc(parsed)));
  }

  private logEntityProgress(
    processed: number,
    total: number,
    startedAtMs: number,
    summary: FundingRoundParticipantBackfillSummary,
    progressEvery: number,
  ) {
    if (processed !== 1 && processed !== total && processed % progressEvery !== 0) return;

    const elapsedMs = Math.max(Date.now() - startedAtMs, 1);
    const perSecond = processed / (elapsedMs / 1000);
    const remaining = total > processed ? Math.ceil((total - processed) / Math.max(perSecond, 0.001)) : 0;
    this.logProgress(
      `processed=${processed}/${total} rate=${perSecond.toFixed(2)}/s eta=${remaining}s rawInvestors=${summary.rawInvestorsScanned} wouldCreate=${summary.wouldCreate} verified=${summary.verified} proposed=${summary.proposed} conflicts=${summary.conflicts} unmatched=${summary.unmatched}`,
    );
  }

  private auditOperationForStatus(matchStatus: FundingRoundParticipantMatchStatus): FundingRoundParticipantAuditOperation {
    if (matchStatus === "verified") return "verify";
    if (matchStatus === "conflict") return "conflict";
    return "propose";
  }

  private async writeAudit(input: Partial<FundingRoundParticipantAuditLog>) {
    await this.auditLogModel.create(input);
  }

  private definedNumber(value: any): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toObjectId(value: any): Types.ObjectId | null {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return null;
  }

  private objectIdKey(value: any): string {
    const objectId = this.toObjectId(value);
    return objectId ? String(objectId) : "";
  }

  private logProgress(message: string) {
    console.error(`[funding-round-participants] ${new Date().toISOString()} ${message}`);
  }
}
