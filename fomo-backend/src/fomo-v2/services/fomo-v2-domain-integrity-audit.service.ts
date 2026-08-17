import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Collection, Connection, Model } from "mongoose";

type IndexKey = Record<string, 1 | -1>;

interface CriticalIndexSpec {
  label: string;
  key: IndexKey;
  unique?: boolean;
}

interface CollectionCheck {
  exists: boolean;
  count: number | null;
}

interface IntegrityFinding {
  count: number;
  examples: any[];
  skipped?: string;
}

export interface FomoV2DomainIntegrityAuditReport {
  ok: boolean;
  generatedAt: string;
  mode: "read-only";
  counts: {
    registeredSchemas: Array<Record<string, any>>;
    activeCollections: string[];
    collectionCounts: Record<string, CollectionCheck>;
  };
  indexes: {
    checkedCollections: Record<string, any>;
    missingIndexes: Array<Record<string, any>>;
    unexpectedIndexWarnings: string[];
  };
  danglingRefs: Record<string, IntegrityFinding>;
  duplicates: Record<string, Record<string, IntegrityFinding>>;
  sourcePolicy: Record<string, IntegrityFinding>;
  backerPortfolioQuality: Record<string, IntegrityFinding>;
  reviewQuality: Record<string, any>;
  importCandidates: Record<string, IntegrityFinding>;
  extraDbFields: Record<string, any>;
  warnings: string[];
  errors: string[];
  READ_ONLY: "YES";
  WRITES_PERFORMED: 0;
}

const EXPECTED_COLLECTIONS = [
  "canonical_projects",
  "canonical_project_sources",
  "source_entities",
  "source_snapshots",
  "migration_runs",
  "market_assets",
  "project_asset_links",
  "market_project_read_models",
  "market_project_histories",
  "project_market_snapshots",
  "funding_rounds",
  "funding_round_participants",
  "token_allocations",
  "vesting_rounds",
  "vesting_schedules",
  "unlock_events",
  "vesting_summaries",
  "backer_portfolio_holdings",
  "project_domain_sources",
  "review_batches",
  "import_candidates",
] as const;

const NEW_DOMAIN_COLLECTIONS = [
  "funding_rounds",
  "funding_round_participants",
  "token_allocations",
  "vesting_rounds",
  "vesting_schedules",
  "unlock_events",
  "vesting_summaries",
  "backer_portfolio_holdings",
  "project_domain_sources",
  "review_batches",
  "import_candidates",
] as const;

const CRITICAL_INDEXES: Record<string, CriticalIndexSpec[]> = {
  funding_rounds: [
    {
      label: "canonicalFingerprint",
      key: { canonicalFingerprint: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_normalizedRoundType_announcedDate",
      key: { canonicalProjectId: 1, normalizedRoundType: 1, announcedDate: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_primarySource_sourceId",
      key: { canonicalProjectId: 1, primarySource: 1, sourceId: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_roundKey",
      key: { canonicalProjectId: 1, roundKey: 1 },
      unique: true,
    },
  ],
  funding_round_participants: [
    {
      label: "canonicalFingerprint",
      key: { canonicalFingerprint: 1 },
      unique: true,
    },
    {
      label: "fundingRoundId_backerId",
      key: { fundingRoundId: 1, backerId: 1 },
      unique: true,
    },
  ],
  backer_portfolio_holdings: [
    {
      label: "backerId_canonicalProjectId",
      key: { backerId: 1, canonicalProjectId: 1 },
      unique: true,
    },
    {
      label: "backerId",
      key: { backerId: 1 },
    },
    {
      label: "canonicalProjectId",
      key: { canonicalProjectId: 1 },
    },
    {
      label: "isLead",
      key: { isLead: 1 },
    },
    {
      label: "firstRoundDate",
      key: { firstRoundDate: 1 },
    },
    {
      label: "hasMarketData",
      key: { hasMarketData: 1 },
    },
  ],
  project_domain_sources: [
    {
      label: "canonicalProjectId_domain",
      key: { canonicalProjectId: 1, domain: 1 },
      unique: true,
    },
  ],
  review_batches: [
    {
      label: "fingerprint",
      key: { fingerprint: 1 },
      unique: true,
    },
    {
      label: "status_domain_reason",
      key: { status: 1, domain: 1, reason: 1 },
    },
    {
      label: "canonicalProjectId_domain_status",
      key: { canonicalProjectId: 1, domain: 1, status: 1 },
    },
  ],
  import_candidates: [
    {
      label: "candidateFingerprint",
      key: { candidateFingerprint: 1 },
      unique: true,
    },
    {
      label: "status_domain_entityType",
      key: { status: 1, domain: 1, entityType: 1 },
    },
    {
      label: "sourceType_entityType_normalizedName",
      key: { sourceType: 1, entityType: 1, normalizedName: 1 },
    },
    {
      label: "lastSeenAt",
      key: { lastSeenAt: -1 },
    },
  ],
  token_allocations: [
    {
      label: "canonicalFingerprint",
      key: { canonicalFingerprint: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_sourceType_saleId",
      key: { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_normalizedName",
      key: { canonicalProjectId: 1, normalizedName: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_sourceType",
      key: { canonicalProjectId: 1, sourceType: 1 },
    },
  ],
  vesting_rounds: [
    {
      label: "canonicalFingerprint",
      key: { canonicalFingerprint: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_sourceType_saleId",
      key: { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_normalizedRoundName",
      key: { canonicalProjectId: 1, normalizedRoundName: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_sourceType",
      key: { canonicalProjectId: 1, sourceType: 1 },
    },
  ],
  vesting_schedules: [
    {
      label: "canonicalFingerprint",
      key: { canonicalFingerprint: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_sourceType_saleId",
      key: { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
      unique: true,
    },
    {
      label: "vestingRoundId",
      key: { vestingRoundId: 1 },
    },
    {
      label: "canonicalProjectId_normalizedRoundName",
      key: { canonicalProjectId: 1, normalizedRoundName: 1 },
    },
  ],
  unlock_events: [
    {
      label: "canonicalFingerprint",
      key: { canonicalFingerprint: 1 },
      unique: true,
    },
    {
      label: "canonicalProjectId_unlockDate",
      key: { canonicalProjectId: 1, unlockDate: 1 },
    },
    {
      label: "sourceType_unlockDate",
      key: { sourceType: 1, unlockDate: 1 },
    },
    {
      label: "canonicalProjectId_sourceType_saleId",
      key: { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
    },
    {
      label: "canonicalProjectId_sourceType_normalizedRoundName",
      key: { canonicalProjectId: 1, sourceType: 1, normalizedRoundName: 1 },
    },
    {
      label: "canonicalProjectId_sourceType_vestingDatasetKey",
      key: { canonicalProjectId: 1, sourceType: 1, vestingDatasetKey: 1 },
    },
  ],
  vesting_summaries: [
    {
      label: "canonicalProjectId_sourceType",
      key: { canonicalProjectId: 1, sourceType: 1 },
      unique: true,
    },
    {
      label: "canonicalFingerprint",
      key: { canonicalFingerprint: 1 },
      unique: true,
    },
  ],
};

const MAX_REVIEW_CANDIDATES = 100;
const EXAMPLE_LIMIT = 20;

@Injectable()
export class FomoV2DomainIntegrityAuditService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async run(): Promise<FomoV2DomainIntegrityAuditReport> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const activeCollections = await this.listActiveCollections();
    const activeCollectionSet = new Set(activeCollections);
    const collectionCounts = await this.collectionCounts(
      activeCollectionSet,
      warnings
    );
    const indexes = await this.auditIndexes(
      activeCollectionSet,
      warnings,
      errors
    );
    const danglingRefs = await this.auditDanglingRefs(
      activeCollectionSet,
      errors
    );
    const duplicates = await this.auditDuplicates(activeCollectionSet, errors);
    const sourcePolicy = await this.auditSourcePolicy(
      activeCollectionSet,
      errors
    );
    const backerPortfolioQuality = await this.auditBackerPortfolioQuality(
      activeCollectionSet
    );
    const reviewQuality = await this.auditReviewQuality(
      activeCollectionSet,
      warnings
    );
    const importCandidates = await this.auditImportCandidates(
      activeCollectionSet,
      errors
    );
    const extraDbFields = await this.auditExtraDbFields(
      activeCollectionSet,
      warnings
    );

    return {
      ok: errors.length === 0,
      generatedAt: new Date().toISOString(),
      mode: "read-only",
      counts: {
        registeredSchemas: this.registeredSchemas(),
        activeCollections,
        collectionCounts,
      },
      indexes,
      danglingRefs,
      duplicates,
      sourcePolicy,
      backerPortfolioQuality,
      reviewQuality,
      importCandidates,
      extraDbFields,
      warnings,
      errors,
      READ_ONLY: "YES",
      WRITES_PERFORMED: 0,
    };
  }

  private registeredSchemas(): Array<Record<string, any>> {
    return this.connection.modelNames().map((modelName) => {
      const model = this.connection.model(modelName);
      return {
        modelName,
        collection: model.collection.collectionName,
        declaredIndexes: (model.schema.indexes() as any[])
          .map((definition) => String(definition?.[1]?.name || ""))
          .filter(Boolean),
      };
    });
  }

  private async listActiveCollections(): Promise<string[]> {
    const collections = await this.db()
      .listCollections({}, { nameOnly: true })
      .toArray();
    return collections.map((collection) => collection.name).sort();
  }

  private async collectionCounts(
    activeCollections: Set<string>,
    warnings: string[]
  ): Promise<Record<string, CollectionCheck>> {
    const counts: Record<string, CollectionCheck> = {};
    for (const collection of EXPECTED_COLLECTIONS) {
      if (!activeCollections.has(collection)) {
        counts[collection] = { exists: false, count: null };
        warnings.push(`Expected collection ${collection} is not present yet.`);
        continue;
      }
      counts[collection] = {
        exists: true,
        count: await this.collection(collection).countDocuments({}),
      };
    }
    return counts;
  }

  private async auditIndexes(
    activeCollections: Set<string>,
    warnings: string[],
    errors: string[]
  ): Promise<FomoV2DomainIntegrityAuditReport["indexes"]> {
    const checkedCollections: Record<string, any> = {};
    const missingIndexes: Array<Record<string, any>> = [];
    const unexpectedIndexWarnings: string[] = [];

    for (const [collectionName, specs] of Object.entries(CRITICAL_INDEXES)) {
      if (!activeCollections.has(collectionName)) {
        checkedCollections[collectionName] = {
          exists: false,
          indexes: [],
          skipped: "collection_missing",
        };
        warnings.push(
          `Skipping critical index check for missing collection ${collectionName}.`
        );
        continue;
      }

      const indexes = await this.safeListIndexes(collectionName);
      const checks = specs.map((spec) => {
        const matching = indexes.find((index) =>
          indexKeyEquals(index.key, spec.key)
        );
        const present = Boolean(
          matching &&
            (spec.unique === undefined ||
              Boolean(matching.unique) === spec.unique)
        );
        if (
          matching &&
          spec.unique !== undefined &&
          Boolean(matching.unique) !== spec.unique
        ) {
          unexpectedIndexWarnings.push(
            `${collectionName}.${spec.label} exists with unique=${Boolean(
              matching.unique
            )}, expected unique=${spec.unique}.`
          );
        }
        if (!present) {
          const missing = {
            collection: collectionName,
            label: spec.label,
            key: spec.key,
            unique: spec.unique,
          };
          missingIndexes.push(missing);
          errors.push(
            `Missing critical index ${collectionName}.${spec.label}.`
          );
        }
        return {
          label: spec.label,
          key: spec.key,
          unique: spec.unique,
          present,
          matchedIndexName: matching?.name,
        };
      });

      checkedCollections[collectionName] = {
        exists: true,
        indexes: indexes.map((index) => ({
          name: index.name,
          key: index.key,
          unique: Boolean(index.unique),
        })),
        checks,
      };
    }

    return { checkedCollections, missingIndexes, unexpectedIndexWarnings };
  }

  private async auditDanglingRefs(
    activeCollections: Set<string>,
    errors: string[]
  ): Promise<Record<string, IntegrityFinding>> {
    const findings = {
      danglingFundingRoundsCanonicalProject: await this.danglingRef(
        activeCollections,
        "funding_rounds",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingFundingParticipantsCanonicalProject: await this.danglingRef(
        activeCollections,
        "funding_round_participants",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingFundingParticipantsRound: await this.danglingRef(
        activeCollections,
        "funding_round_participants",
        "fundingRoundId",
        "funding_rounds"
      ),
      danglingTokenAllocationsCanonicalProject: await this.danglingRef(
        activeCollections,
        "token_allocations",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingVestingRoundsCanonicalProject: await this.danglingRef(
        activeCollections,
        "vesting_rounds",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingVestingSchedulesCanonicalProject: await this.danglingRef(
        activeCollections,
        "vesting_schedules",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingVestingSchedulesRound: await this.danglingRef(
        activeCollections,
        "vesting_schedules",
        "vestingRoundId",
        "vesting_rounds"
      ),
      danglingUnlockEventsCanonicalProject: await this.danglingRef(
        activeCollections,
        "unlock_events",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingUnlockEventsVestingRound: await this.danglingRef(
        activeCollections,
        "unlock_events",
        "vestingRoundId",
        "vesting_rounds"
      ),
      danglingVestingSummariesCanonicalProject: await this.danglingRef(
        activeCollections,
        "vesting_summaries",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingPortfolioHoldingsBacker: await this.danglingRef(
        activeCollections,
        "backer_portfolio_holdings",
        "backerId",
        "backers"
      ),
      danglingPortfolioHoldingsCanonicalProject: await this.danglingRef(
        activeCollections,
        "backer_portfolio_holdings",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingPortfolioHoldingsRoundIds: await this.danglingArrayRef(
        activeCollections,
        "backer_portfolio_holdings",
        "roundIds",
        "funding_rounds"
      ),
      danglingPortfolioHoldingsParticipantIds: await this.danglingArrayRef(
        activeCollections,
        "backer_portfolio_holdings",
        "participantIds",
        "funding_round_participants"
      ),
      danglingProjectDomainSourcesCanonicalProject: await this.danglingRef(
        activeCollections,
        "project_domain_sources",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingReviewBatchesCanonicalProject: await this.danglingRef(
        activeCollections,
        "review_batches",
        "canonicalProjectId",
        "canonical_projects"
      ),
    };

    for (const [key, finding] of Object.entries(findings)) {
      if (finding.count > 0)
        errors.push(`${key} has ${finding.count} dangling refs.`);
    }

    return findings;
  }

  private async auditDuplicates(
    activeCollections: Set<string>,
    errors: string[]
  ): Promise<Record<string, Record<string, IntegrityFinding>>> {
    const duplicates = {
      funding_rounds: {
        duplicatesByCanonicalFingerprint: await this.duplicateGroups(
          activeCollections,
          "funding_rounds",
          ["canonicalFingerprint"]
        ),
        duplicatesByProjectRoundTypeDate: await this.duplicateGroups(
          activeCollections,
          "funding_rounds",
          ["canonicalProjectId", "normalizedRoundType", "announcedDate"]
        ),
        duplicatesByProjectPrimarySourceSourceId: await this.duplicateGroups(
          activeCollections,
          "funding_rounds",
          ["canonicalProjectId", "primarySource", "sourceId"]
        ),
      },
      funding_round_participants: {
        duplicatesByCanonicalFingerprint: await this.duplicateGroups(
          activeCollections,
          "funding_round_participants",
          ["canonicalFingerprint"]
        ),
        duplicatesByRoundBackerId: await this.duplicateGroups(
          activeCollections,
          "funding_round_participants",
          ["fundingRoundId", "backerId"]
        ),
      },
      token_allocations: {
        duplicatesByCanonicalFingerprint: await this.duplicateGroups(
          activeCollections,
          "token_allocations",
          ["canonicalFingerprint"]
        ),
        duplicatesByProjectSourceSaleId: await this.duplicateGroups(
          activeCollections,
          "token_allocations",
          ["canonicalProjectId", "sourceType", "saleId"]
        ),
        duplicatesByProjectNormalizedName: await this.duplicateGroups(
          activeCollections,
          "token_allocations",
          ["canonicalProjectId", "normalizedName"]
        ),
      },
      vesting_rounds: {
        duplicatesByCanonicalFingerprint: await this.duplicateGroups(
          activeCollections,
          "vesting_rounds",
          ["canonicalFingerprint"]
        ),
        duplicatesByProjectSourceSaleId: await this.duplicateGroups(
          activeCollections,
          "vesting_rounds",
          ["canonicalProjectId", "sourceType", "saleId"]
        ),
        duplicatesByProjectNormalizedRoundName: await this.duplicateGroups(
          activeCollections,
          "vesting_rounds",
          ["canonicalProjectId", "normalizedRoundName"]
        ),
      },
      vesting_schedules: {
        duplicatesByCanonicalFingerprint: await this.duplicateGroups(
          activeCollections,
          "vesting_schedules",
          ["canonicalFingerprint"]
        ),
        duplicatesByProjectSourceSaleId: await this.duplicateGroups(
          activeCollections,
          "vesting_schedules",
          ["canonicalProjectId", "sourceType", "saleId"]
        ),
      },
      unlock_events: {
        duplicatesByCanonicalFingerprint: await this.duplicateGroups(
          activeCollections,
          "unlock_events",
          ["canonicalFingerprint"]
        ),
        duplicatesByProjectSourceSaleDateType: await this.duplicateGroups(
          activeCollections,
          "unlock_events",
          [
            "canonicalProjectId",
            "sourceType",
            "saleId",
            "unlockDate",
            "unlockType",
          ]
        ),
      },
      vesting_summaries: {
        duplicatesByCanonicalFingerprint: await this.duplicateGroups(
          activeCollections,
          "vesting_summaries",
          ["canonicalFingerprint"]
        ),
        duplicatesByProjectSource: await this.duplicateGroups(
          activeCollections,
          "vesting_summaries",
          ["canonicalProjectId", "sourceType"]
        ),
      },
      backer_portfolio_holdings: {
        duplicatesByBackerProject: await this.duplicateGroups(
          activeCollections,
          "backer_portfolio_holdings",
          ["backerId", "canonicalProjectId"]
        ),
      },
      project_domain_sources: {
        duplicatesByProjectDomain: await this.duplicateGroups(
          activeCollections,
          "project_domain_sources",
          ["canonicalProjectId", "domain"]
        ),
      },
      review_batches: {
        duplicatesByFingerprint: await this.duplicateGroups(
          activeCollections,
          "review_batches",
          ["fingerprint"]
        ),
      },
      import_candidates: {
        duplicatesByCandidateFingerprint: await this.duplicateGroups(
          activeCollections,
          "import_candidates",
          ["candidateFingerprint"]
        ),
      },
    };

    for (const [collection, collectionFindings] of Object.entries(duplicates)) {
      for (const [key, finding] of Object.entries(collectionFindings)) {
        if (finding.count > 0)
          errors.push(
            `${collection}.${key} has ${finding.count} duplicate groups.`
          );
      }
    }

    return duplicates;
  }

  private async auditBackerPortfolioQuality(
    activeCollections: Set<string>
  ): Promise<Record<string, IntegrityFinding>> {
    if (!activeCollections.has("backer_portfolio_holdings")) {
      return {
        duplicatesByBackerProject: zeroFinding("collection_missing"),
        danglingHoldingBacker: zeroFinding("collection_missing"),
        danglingHoldingCanonicalProject: zeroFinding("collection_missing"),
        danglingHoldingRoundIds: zeroFinding("collection_missing"),
        danglingHoldingParticipantIds: zeroFinding("collection_missing"),
        holdingsWithoutMarketData: zeroFinding("collection_missing"),
      };
    }

    return {
      duplicatesByBackerProject: await this.duplicateGroups(
        activeCollections,
        "backer_portfolio_holdings",
        ["backerId", "canonicalProjectId"]
      ),
      danglingHoldingBacker: await this.danglingRef(
        activeCollections,
        "backer_portfolio_holdings",
        "backerId",
        "backers"
      ),
      danglingHoldingCanonicalProject: await this.danglingRef(
        activeCollections,
        "backer_portfolio_holdings",
        "canonicalProjectId",
        "canonical_projects"
      ),
      danglingHoldingRoundIds: await this.danglingArrayRef(
        activeCollections,
        "backer_portfolio_holdings",
        "roundIds",
        "funding_rounds"
      ),
      danglingHoldingParticipantIds: await this.danglingArrayRef(
        activeCollections,
        "backer_portfolio_holdings",
        "participantIds",
        "funding_round_participants"
      ),
      holdingsWithoutMarketData: await this.findingByPipeline(
        "backer_portfolio_holdings",
        [
          {
            $match: {
              $or: [
                { hasMarketData: { $exists: false } },
                { hasMarketData: false },
                { hasMarketData: null },
              ],
            },
          },
          {
            $project: {
              _id: 1,
              backerId: 1,
              backerName: 1,
              canonicalProjectId: 1,
              projectName: 1,
              projectSlug: 1,
              projectSymbol: 1,
              hasMarketData: 1,
              marketAssetId: 1,
            },
          },
        ]
      ),
    };
  }

  private async auditSourcePolicy(
    activeCollections: Set<string>,
    errors: string[]
  ): Promise<Record<string, IntegrityFinding>> {
    const sourcePolicy = {
      fundingRoundsWithoutSourceLock: await this.sourcePolicyWithoutLock(
        activeCollections,
        "funding_rounds",
        "funding"
      ),
      fundingRoundsSourceLockConflicts: await this.sourcePolicyConflicts(
        activeCollections,
        "funding_rounds",
        "funding"
      ),
      fundingParticipantsWithoutSourceLock: await this.sourcePolicyWithoutLock(
        activeCollections,
        "funding_round_participants",
        "funding"
      ),
      fundingParticipantsSourceLockConflicts: await this.sourcePolicyConflicts(
        activeCollections,
        "funding_round_participants",
        "funding"
      ),
    };

    for (const [key, finding] of Object.entries(sourcePolicy)) {
      if (key.includes("Conflicts") && finding.count > 0) {
        errors.push(`${key} has ${finding.count} source lock conflicts.`);
      }
    }

    return sourcePolicy;
  }

  private async auditReviewQuality(
    activeCollections: Set<string>,
    warnings: string[]
  ): Promise<Record<string, any>> {
    if (!activeCollections.has("review_batches")) {
      return {
        skipped: "review_batches_collection_missing",
        openReviewBatchesByReason: [],
        openReviewBatchesByDomain: [],
        reviewBatchesWithoutCandidatesButCandidateCountPositive:
          zeroFinding("collection_missing"),
        reviewBatchesWithCandidatesOverLimit: zeroFinding("collection_missing"),
        reviewBatchesMissingFingerprint: zeroFinding("collection_missing"),
        sourceConflictBatchesMissingSourceTypes:
          zeroFinding("collection_missing"),
        missingCanonicalProjectBatchesMissingProjectIdentity:
          zeroFinding("collection_missing"),
      };
    }

    const [
      openReviewBatchesByReason,
      openReviewBatchesByDomain,
      withoutCandidates,
      overLimit,
      missingFingerprint,
      missingSourceConflictFields,
      missingCanonicalIdentity,
    ] = await Promise.all([
      this.groupCounts("review_batches", { status: "open" }, ["reason"]),
      this.groupCounts("review_batches", { status: "open" }, ["domain"]),
      this.findingByPipeline("review_batches", [
        {
          $match: {
            candidateCount: { $gt: 0 },
            $expr: { $eq: [{ $size: { $ifNull: ["$candidates", []] } }, 0] },
          },
        },
      ]),
      this.findingByPipeline("review_batches", [
        {
          $match: {
            $expr: {
              $gt: [
                { $size: { $ifNull: ["$candidates", []] } },
                MAX_REVIEW_CANDIDATES,
              ],
            },
          },
        },
      ]),
      this.findingByPipeline("review_batches", [
        {
          $match: {
            $or: [
              { fingerprint: { $exists: false } },
              { fingerprint: null },
              { fingerprint: "" },
            ],
          },
        },
      ]),
      this.findingByPipeline("review_batches", [
        {
          $match: {
            reason: "SOURCE_CONFLICT",
            $or: [
              { canonicalProjectId: { $exists: false } },
              { canonicalProjectId: null },
              { currentSourceType: { $exists: false } },
              { currentSourceType: "" },
              { incomingSourceType: { $exists: false } },
              { incomingSourceType: "" },
              { domain: { $exists: false } },
              { domain: "" },
            ],
          },
        },
      ]),
      this.findingByPipeline("review_batches", [
        {
          $match: {
            reason: "MISSING_CANONICAL_PROJECT",
            $and: [
              {
                $or: [
                  { projectKey: { $exists: false } },
                  { projectKey: "" },
                  { projectKey: null },
                ],
              },
              {
                $or: [
                  { projectName: { $exists: false } },
                  { projectName: "" },
                  { projectName: null },
                ],
              },
              {
                $or: [
                  { normalizedProjectName: { $exists: false } },
                  { normalizedProjectName: "" },
                  { normalizedProjectName: null },
                ],
              },
            ],
          },
        },
      ]),
    ]);

    for (const [label, finding] of Object.entries({
      reviewBatchesWithoutCandidatesButCandidateCountPositive:
        withoutCandidates,
      reviewBatchesWithCandidatesOverLimit: overLimit,
      reviewBatchesMissingFingerprint: missingFingerprint,
      sourceConflictBatchesMissingSourceTypes: missingSourceConflictFields,
      missingCanonicalProjectBatchesMissingProjectIdentity:
        missingCanonicalIdentity,
    })) {
      if (finding.count > 0)
        warnings.push(`${label} has ${finding.count} rows.`);
    }

    return {
      openReviewBatchesByReason,
      openReviewBatchesByDomain,
      reviewBatchesWithoutCandidatesButCandidateCountPositive:
        withoutCandidates,
      reviewBatchesWithCandidatesOverLimit: overLimit,
      reviewBatchesMissingFingerprint: missingFingerprint,
      sourceConflictBatchesMissingSourceTypes: missingSourceConflictFields,
      missingCanonicalProjectBatchesMissingProjectIdentity:
        missingCanonicalIdentity,
    };
  }

  private async auditImportCandidates(
    activeCollections: Set<string>,
    errors: string[]
  ): Promise<Record<string, IntegrityFinding>> {
    if (!activeCollections.has("import_candidates")) {
      return {
        invalidStatuses: zeroFinding("collection_missing"),
        missingNormalizedIdentity: zeroFinding("collection_missing"),
        missingCandidateFingerprint: zeroFinding("collection_missing"),
      };
    }

    const findings = {
      invalidStatuses: await this.findingByPipeline("import_candidates", [
        {
          $match: {
            $or: [
              { status: { $exists: false } },
              { status: null },
              { status: { $nin: ["open", "resolved", "ignored", "superseded"] } },
            ],
          },
        },
      ]),
      missingNormalizedIdentity: await this.findingByPipeline(
        "import_candidates",
        [
          {
            $match: {
              $or: [
                {
                  entityType: "backer",
                  $or: [
                    { normalizedName: { $exists: false } },
                    { normalizedName: "" },
                    { normalizedName: null },
                  ],
                },
                {
                  entityType: "project",
                  $and: [
                    {
                      $or: [
                        { normalizedName: { $exists: false } },
                        { normalizedName: "" },
                        { normalizedName: null },
                      ],
                    },
                    {
                      $or: [
                        { normalizedSymbol: { $exists: false } },
                        { normalizedSymbol: "" },
                        { normalizedSymbol: null },
                      ],
                    },
                    {
                      $or: [
                        { normalizedSlug: { $exists: false } },
                        { normalizedSlug: "" },
                        { normalizedSlug: null },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ]
      ),
      missingCandidateFingerprint: await this.findingByPipeline(
        "import_candidates",
        [
          {
            $match: {
              $or: [
                { candidateFingerprint: { $exists: false } },
                { candidateFingerprint: "" },
                { candidateFingerprint: null },
              ],
            },
          },
        ]
      ),
    };

    for (const [key, finding] of Object.entries(findings)) {
      if (finding.count > 0)
        errors.push(`import_candidates.${key} has ${finding.count} rows.`);
    }

    return findings;
  }

  private async auditExtraDbFields(
    activeCollections: Set<string>,
    warnings: string[]
  ): Promise<Record<string, any>> {
    const output: Record<string, any> = {};
    for (const collectionName of NEW_DOMAIN_COLLECTIONS) {
      const model = this.modelByCollection(collectionName);
      if (!model) {
        output[collectionName] = {
          exists: activeCollections.has(collectionName),
          extraFields: [],
          error: "model_not_registered",
        };
        warnings.push(`No registered model found for ${collectionName}.`);
        continue;
      }

      const allowedFields = allowedTopLevelFields(model);
      if (!activeCollections.has(collectionName)) {
        output[collectionName] = {
          exists: false,
          allowedFields: Array.from(allowedFields).sort(),
          observedFields: [],
          extraFields: [],
        };
        continue;
      }

      const observedFields = await this.observedTopLevelFields(collectionName);
      const extraFields = observedFields.filter(
        (field) => !allowedFields.has(field)
      );
      if (extraFields.length)
        warnings.push(
          `${collectionName} has extra DB fields: ${extraFields.join(", ")}`
        );
      output[collectionName] = {
        exists: true,
        allowedFields: Array.from(allowedFields).sort(),
        observedFields,
        extraFields,
      };
    }
    return output;
  }

  private async danglingRef(
    activeCollections: Set<string>,
    sourceCollection: string,
    localField: string,
    targetCollection: string
  ): Promise<IntegrityFinding> {
    if (!activeCollections.has(sourceCollection))
      return zeroFinding("source_collection_missing");
    const pipeline = [
      { $match: { [localField]: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: targetCollection,
          localField,
          foreignField: "_id",
          as: "_target",
        },
      },
      { $match: { _target: { $size: 0 } } },
      {
        $facet: {
          total: [{ $count: "count" }],
          examples: [
            { $limit: EXAMPLE_LIMIT },
            { $project: { _id: 1, [localField]: 1 } },
          ],
        },
      },
    ];
    return this.findingFromFacet(sourceCollection, pipeline);
  }

  private async danglingArrayRef(
    activeCollections: Set<string>,
    sourceCollection: string,
    localField: string,
    targetCollection: string
  ): Promise<IntegrityFinding> {
    if (!activeCollections.has(sourceCollection))
      return zeroFinding("source_collection_missing");
    const pipeline = [
      {
        $set: {
          _localRefs: {
            $filter: {
              input: { $ifNull: [`$${localField}`, []] },
              as: "ref",
              cond: { $ne: ["$$ref", null] },
            },
          },
        },
      },
      { $match: { $expr: { $gt: [{ $size: "$_localRefs" }, 0] } } },
      {
        $lookup: {
          from: targetCollection,
          localField,
          foreignField: "_id",
          as: "_target",
        },
      },
      {
        $set: {
          _missingRefs: { $setDifference: ["$_localRefs", "$_target._id"] },
        },
      },
      { $match: { $expr: { $gt: [{ $size: "$_missingRefs" }, 0] } } },
      {
        $facet: {
          total: [{ $count: "count" }],
          examples: [
            { $limit: EXAMPLE_LIMIT },
            { $project: { _id: 1, [localField]: 1, missingRefs: "$_missingRefs" } },
          ],
        },
      },
    ];
    return this.findingFromFacet(sourceCollection, pipeline);
  }

  private async duplicateGroups(
    activeCollections: Set<string>,
    collectionName: string,
    keyFields: string[]
  ): Promise<IntegrityFinding> {
    if (!activeCollections.has(collectionName))
      return zeroFinding("collection_missing");
    const match: Record<string, any> = {};
    for (const field of keyFields) match[field] = { $exists: true, $ne: null };
    const groupId = Object.fromEntries(
      keyFields.map((field) => [field, `$${field}`])
    );
    return this.findingFromFacet(collectionName, [
      { $match: match },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      {
        $facet: {
          total: [{ $count: "count" }],
          examples: [
            { $limit: EXAMPLE_LIMIT },
            { $project: { _id: 1, count: 1, ids: { $slice: ["$ids", 10] } } },
          ],
        },
      },
    ]);
  }

  private async sourcePolicyWithoutLock(
    activeCollections: Set<string>,
    collectionName: string,
    domain: string
  ): Promise<IntegrityFinding> {
    if (!activeCollections.has(collectionName))
      return zeroFinding("collection_missing");
    return this.findingFromFacet(collectionName, [
      { $match: { canonicalProjectId: { $exists: true, $ne: null } } },
      sourceLockLookupStage(domain),
      { $set: { sourceLock: { $first: "$sourceLocks" } } },
      { $match: { sourceLock: null } },
      {
        $facet: {
          total: [{ $count: "count" }],
          examples: [
            { $limit: EXAMPLE_LIMIT },
            {
              $project: {
                _id: 1,
                canonicalProjectId: 1,
                primarySource: 1,
                sourceType: 1,
              },
            },
          ],
        },
      },
    ]);
  }

  private async sourcePolicyConflicts(
    activeCollections: Set<string>,
    collectionName: string,
    domain: string
  ): Promise<IntegrityFinding> {
    if (!activeCollections.has(collectionName))
      return zeroFinding("collection_missing");
    return this.findingFromFacet(collectionName, [
      { $match: { canonicalProjectId: { $exists: true, $ne: null } } },
      sourceLockLookupStage(domain),
      { $set: { sourceLock: { $first: "$sourceLocks" } } },
      { $match: { sourceLock: { $ne: null } } },
      {
        $set: {
          normalizedDocumentSource: {
            $toLower: {
              $ifNull: ["$sourceType", { $ifNull: ["$primarySource", ""] }],
            },
          },
          normalizedSelectedSourceType: {
            $toLower: { $ifNull: ["$sourceLock.selectedSourceType", ""] },
          },
        },
      },
      {
        $match: {
          $expr: {
            $ne: [
              "$normalizedDocumentSource",
              "$normalizedSelectedSourceType",
            ],
          },
        },
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          examples: [
            { $limit: EXAMPLE_LIMIT },
            {
              $project: {
                _id: 1,
                canonicalProjectId: 1,
                primarySource: 1,
                sourceType: 1,
                selectedSourceType: "$sourceLock.selectedSourceType",
              },
            },
          ],
        },
      },
    ]);
  }

  private async groupCounts(
    collectionName: string,
    match: Record<string, any>,
    fields: string[]
  ): Promise<Array<Record<string, any>>> {
    const groupId = Object.fromEntries(
      fields.map((field) => [field, `$${field}`])
    );
    return this.collection(collectionName)
      .aggregate([
        { $match: match },
        { $group: { _id: groupId, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();
  }

  private async findingByPipeline(
    collectionName: string,
    pipeline: any[]
  ): Promise<IntegrityFinding> {
    return this.findingFromFacet(collectionName, [
      ...pipeline,
      {
        $facet: {
          total: [{ $count: "count" }],
          examples: [{ $limit: EXAMPLE_LIMIT }],
        },
      },
    ]);
  }

  private async findingFromFacet(
    collectionName: string,
    pipeline: any[]
  ): Promise<IntegrityFinding> {
    const [result] = await this.collection(collectionName)
      .aggregate(pipeline)
      .toArray();
    return {
      count: Number(result?.total?.[0]?.count || 0),
      examples: result?.examples || [],
    };
  }

  private async observedTopLevelFields(
    collectionName: string
  ): Promise<string[]> {
    const rows = await this.collection(collectionName)
      .aggregate([
        { $limit: 1000 },
        { $project: { fields: { $objectToArray: "$$ROOT" } } },
        { $unwind: "$fields" },
        { $group: { _id: "$fields.k" } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    return rows.map((row) => String(row._id));
  }

  private async safeListIndexes(collectionName: string): Promise<any[]> {
    try {
      return await this.collection(collectionName).listIndexes().toArray();
    } catch (error: any) {
      if (error?.codeName === "NamespaceNotFound" || error?.code === 26)
        return [];
      throw error;
    }
  }

  private modelByCollection(collectionName: string): Model<any> | undefined {
    return this.connection
      .modelNames()
      .map((modelName) => this.connection.model(modelName))
      .find((model) => model.collection.collectionName === collectionName);
  }

  private collection(name: string): Collection {
    return this.db().collection(name) as unknown as Collection;
  }

  private db(): any {
    return (this.connection as any).db;
  }
}

function zeroFinding(skipped?: string): IntegrityFinding {
  return { count: 0, examples: [], skipped };
}

function sourceLockLookupStage(domain: string): Record<string, any> {
  return {
    $lookup: {
      from: "project_domain_sources",
      let: { projectId: "$canonicalProjectId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$canonicalProjectId", "$$projectId"] },
                { $eq: ["$domain", domain] },
              ],
            },
          },
        },
        { $limit: 1 },
      ],
      as: "sourceLocks",
    },
  };
}

function allowedTopLevelFields(model: Model<any>): Set<string> {
  const fields = new Set<string>(["_id", "__v", "createdAt", "updatedAt"]);
  for (const path of Object.keys(model.schema.paths)) {
    fields.add(path.split(".")[0]);
  }
  return fields;
}

function indexKeyEquals(
  actual: Record<string, any>,
  expected: IndexKey
): boolean {
  const actualEntries = Object.entries(actual || {});
  const expectedEntries = Object.entries(expected || {});
  if (actualEntries.length !== expectedEntries.length) return false;
  return expectedEntries.every(([key, value], index) => {
    const [actualKey, actualValue] = actualEntries[index];
    return actualKey === key && Number(actualValue) === Number(value);
  });
}
