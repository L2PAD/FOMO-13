import {
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { FomoV2CanonicalProject } from "../../../models";
import {
  FomoV2ActivityFiltersQueryDto,
  FomoV2ActivityPromotedQueryDto,
  FomoV2ActivityPublicListQueryDto,
} from "../dto";
import { FomoV2Activity, FomoV2ActivityDocument } from "../models";
import {
  FomoV2ActivityContent,
  FomoV2ActivityInteractionState,
  FomoV2ActivityLifecycleStatus,
  FomoV2ActivityUserStateResolver,
  FomoV2ActivityViewerAccess,
  FOMO_V2_ACTIVITY_USER_STATE_RESOLVER,
} from "../types";
import { FomoV2ActivityAccessPolicyService } from "./activity-access-policy.service";
import { resolveActivityByIdentity, sanitizeActivityContent } from "../helpers";
import { FomoV2MarketProjectReadModel } from "../../market/models";
import {
  FomoV2BackerPortfolioHolding,
  FomoV2BackerReadModel,
} from "../../backers/models";

const PUBLIC_ACTIVITY_PROJECTION = {
  _id: 1,
  slug: 1,
  legacyActivityId: 1,
  legacyNumericId: 1,
  parserActivityId: 1,
  canonicalProjectId: 1,
  lifecycleStatus: 1,
  publicationStatus: 1,
  accessTier: 1,
  isSponsored: 1,
  sponsoredPriority: 1,
  publishedSnapshot: 1,
  publishedMetadata: 1,
  sources: 1,
  publishedAt: 1,
  updatedAt: 1,
};

@Injectable()
export class FomoV2ActivityPublicReadService {
  constructor(
    @InjectModel(FomoV2Activity.name)
    private readonly activityModel: Model<FomoV2ActivityDocument>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    private readonly accessPolicy: FomoV2ActivityAccessPolicyService,
    @Optional()
    @Inject(FOMO_V2_ACTIVITY_USER_STATE_RESOLVER)
    private readonly userStateResolver?: FomoV2ActivityUserStateResolver,
    @Optional()
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel?: Model<FomoV2MarketProjectReadModel>,
    @Optional()
    @InjectModel(FomoV2BackerPortfolioHolding.name)
    private readonly backerHoldingModel?: Model<FomoV2BackerPortfolioHolding>,
    @Optional()
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly backerReadModel?: Model<FomoV2BackerReadModel>
  ) {}

  async list(
    query: FomoV2ActivityPublicListQueryDto = {},
    user?: Record<string, any>
  ) {
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const match = this.buildPublicMatch(query);
    await this.applyFavouriteFilter(match, query, user);
    const sort = this.buildSort(query.sort);
    const [rows, total] = await Promise.all([
      this.activityModel
        .find(match, PUBLIC_ACTIVITY_PROJECTION)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      this.activityModel.countDocuments(match),
    ]);
    const canonicalById = await this.loadCanonicalProjects(rows);
    const accessByTier = await this.resolveAccessByTier(rows, user);
    const interactionById = await this.loadInteractionState(rows, user);
    const fomoCounts = await this.loadFomoTaskCounts(rows);
    const commentCounts = await this.loadCommentCounts(rows);
    const items = rows.map((row) =>
      this.toPublicActivity(
        row,
        canonicalById.get(
          String(row.publishedMetadata?.canonicalProjectId || "")
        ),
        accessByTier.get(row.publishedMetadata?.accessTier) || {
          allowed: false,
          contentRedacted: true,
          reason: "entitlement_unavailable",
        },
        interactionById[String(row._id)],
        accessByTier.get("prime"),
        fomoCounts.get(String(row._id)),
        commentCounts.get(String(row._id))
      )
    );

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async get(idOrSlug: string, user?: Record<string, any>) {
    const row = await resolveActivityByIdentity(
      idOrSlug,
      (identity, limit) =>
        this.activityModel
          .find(
            { ...this.publicationFilter(), ...identity },
            PUBLIC_ACTIVITY_PROJECTION
          )
          .limit(limit)
          .lean()
          .exec(),
      { slugField: "publishedMetadata.slug", decodeUri: true }
    );
    if (!row) throw new NotFoundException("FOMO v2 activity not found.");

    const similarRows = await this.findSimilarRows(row);
    const allRows = [row, ...similarRows];
    const canonicalById = await this.loadCanonicalProjects(allRows);
    const accessByTier = await this.resolveAccessByTier(allRows, user);
    const interactionById = await this.loadInteractionState(allRows, user);
    const fomoCounts = await this.loadFomoTaskCounts(allRows);
    const commentCounts = await this.loadCommentCounts(allRows);
    const viewerAccess =
      accessByTier.get(row.publishedMetadata?.accessTier) ||
      (await this.accessPolicy.resolve(
        row.publishedMetadata?.accessTier,
        user
      ));
    const detail = this.toPublicActivity(
      row,
      canonicalById.get(
        String(row.publishedMetadata?.canonicalProjectId || "")
      ),
      viewerAccess,
      interactionById[String(row._id)],
      accessByTier.get("prime"),
      fomoCounts.get(String(row._id)),
      commentCounts.get(String(row._id))
    );
    // EL-1: server-driven Activity Workspace state. Composed from CANONICAL
    // systems (Calendar / Board / FOMO Task progress) for a SINGLE activity —
    // no new collection, no per-card N+1. Only non-sensitive counts/status/ids
    // are exposed here, so this never becomes a Prime-content bypass.
    const workspace = await this.loadWorkspaceState(
      row,
      user,
      fomoCounts.get(String(row._id)) || { count: 0, available: 0, xp: 0 }
    );
    return {
      ...detail,
      workspace,
      similarProjects: similarRows.map((similar) =>
        this.toPublicActivity(
          similar,
          canonicalById.get(
            String(similar.publishedMetadata?.canonicalProjectId || "")
          ),
          accessByTier.get(similar.publishedMetadata?.accessTier) || {
            allowed: false,
            contentRedacted: true,
            reason: "entitlement_unavailable",
          },
          interactionById[String(similar._id)],
          accessByTier.get("prime"),
          fomoCounts.get(String(similar._id)),
          commentCounts.get(String(similar._id))
        )
      ),
    };
  }

  async promoted(
    query: FomoV2ActivityPromotedQueryDto = {},
    user?: Record<string, any>
  ) {
    const limit = query.limit || 10;
    const match: FilterQuery<FomoV2ActivityDocument> = {
      ...this.publicationFilter(),
      isSponsored: true,
    };
    const [rows, total] = await Promise.all([
      this.activityModel
        .find(match, PUBLIC_ACTIVITY_PROJECTION)
        .sort({ sponsoredPriority: -1, publishedAt: -1, _id: -1 })
        .limit(limit)
        .lean()
        .exec(),
      this.activityModel.countDocuments(match),
    ]);
    const canonicalById = await this.loadCanonicalProjects(rows);
    const accessByTier = await this.resolveAccessByTier(rows, user);
    const interactionById = await this.loadInteractionState(rows, user);
    const fomoCounts = await this.loadFomoTaskCounts(rows);
    const commentCounts = await this.loadCommentCounts(rows);
    const items = rows.map((row) =>
      this.toPublicActivity(
        row,
        canonicalById.get(
          String(row.publishedMetadata?.canonicalProjectId || "")
        ),
        accessByTier.get(row.publishedMetadata?.accessTier) || {
          allowed: false,
          contentRedacted: true,
          reason: "entitlement_unavailable",
        },
        interactionById[String(row._id)],
        accessByTier.get("prime"),
        fomoCounts.get(String(row._id)),
        commentCounts.get(String(row._id))
      )
    );

    return { items, total, limit };
  }

  async filters(query: FomoV2ActivityFiltersQueryDto = {}) {
    const limit = query.limit || 20;
    const match: FilterQuery<FomoV2ActivityDocument> = {
      ...this.publicationFilter(),
    };
    if (query.accessTier) {
      match["publishedMetadata.accessTier"] = query.accessTier;
    }
    const [facet] = await this.activityModel
      .aggregate([
        { $match: match },
        {
          $facet: {
            total: [{ $count: "count" }],
            activityTypes: [
              {
                $match: {
                  "publishedSnapshot.activityType": {
                    $type: "string",
                    $ne: "",
                  },
                },
              },
              {
                $group: {
                  _id: "$publishedSnapshot.activityType",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: 1 } },
              { $limit: Math.max(limit, 5) },
            ],
            categories: [
              {
                $match: {
                  "publishedSnapshot.category": { $type: "string", $ne: "" },
                },
              },
              {
                $group: {
                  _id: "$publishedSnapshot.category",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: 1 } },
              { $limit: limit },
            ],
          },
        },
      ])
      .exec();
    const toOptions = (rows: any[] = []) =>
      rows.map((row) => ({
        key: String(row._id)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
        value: String(row._id),
        label: String(row._id),
        count: Number(row.count || 0),
      }));
    const total = Number(facet?.total?.[0]?.count || 0);
    const activityTypeRows = Array.isArray(facet?.activityTypes)
      ? facet.activityTypes
      : [];
    const topFiveCount = activityTypeRows
      .slice(0, 5)
      .reduce((sum, row) => sum + Number(row?.count || 0), 0);
    return {
      total,
      activityTypes: toOptions(activityTypeRows.slice(0, limit)),
      categories: toOptions(facet?.categories),
      otherActivityCount: Math.max(0, total - topFiveCount),
      limit,
    };
  }

  buildPublicMatch(
    query: FomoV2ActivityPublicListQueryDto = {}
  ): FilterQuery<FomoV2ActivityDocument> {
    const match: FilterQuery<FomoV2ActivityDocument> = {
      ...this.publicationFilter(),
    };
    const lifecycleStatuses = this.normalizeLifecycleStatuses(
      query.lifecycleStatus || query.status
    );
    if (lifecycleStatuses.length) {
      match["publishedMetadata.lifecycleStatus"] = { $in: lifecycleStatuses };
    }
    if (query.accessTier) {
      match["publishedMetadata.accessTier"] = query.accessTier;
    }

    const activityTypes = this.splitList(query.activityType || query.type);
    if (activityTypes.length) {
      match["publishedSnapshot.activityType"] = { $in: activityTypes };
    }
    const excludedTypes = this.splitList(query.excludeType);
    if (excludedTypes.length) {
      match["publishedSnapshot.activityType"] = {
        ...(match["publishedSnapshot.activityType"] || {}),
        $nin: excludedTypes,
      };
    }
    const categories = this.splitList(query.category);
    if (categories.length)
      match["publishedSnapshot.category"] = { $in: categories };
    const difficulties = this.splitList(query.difficulty).map((value) =>
      value.toLowerCase()
    );
    if (difficulties.length) {
      match["publishedSnapshot.difficulty"] = { $in: difficulties };
    }
    if (query.hasInvestors === true) {
      match["publishedSnapshot.investors.0"] = { $exists: true };
    }
    if (query.hasInvestors === false) {
      match["publishedSnapshot.investors.0"] = { $exists: false };
    }
    if (query.canonicalProjectId) {
      match["publishedMetadata.canonicalProjectId"] = new Types.ObjectId(
        query.canonicalProjectId
      );
    }
    if (query.search) {
      const pattern = new RegExp(this.escapeRegExp(query.search.trim()), "i");
      match.$or = [
        { "publishedSnapshot.name": pattern },
        { "publishedSnapshot.projectName": pattern },
        { "publishedSnapshot.symbol": pattern },
        { "publishedSnapshot.tags": pattern },
      ];
    }
    return match;
  }

  private publicationFilter(): FilterQuery<FomoV2ActivityDocument> {
    return {
      publicationStatus: "published",
      $and: [
        {
          $or: [{ hiddenAt: { $exists: false } }, { hiddenAt: null }],
        },
        { publishedSnapshot: { $exists: true } },
        { publishedMetadata: { $exists: true } },
      ],
    };
  }

  private async findSimilarRows(activity: any): Promise<any[]> {
    const match = this.buildSimilarMatch(activity);
    if (!match) return [];
    const candidates = await this.activityModel
      .find(match, PUBLIC_ACTIVITY_PROJECTION)
      .sort({ publishedAt: -1, _id: -1 })
      .limit(24)
      .lean()
      .exec();
    return candidates
      .map((candidate) => ({
        candidate,
        score: this.similarityScore(activity, candidate),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map((entry) => entry.candidate);
  }

  private buildSimilarMatch(
    activity: any
  ): FilterQuery<FomoV2ActivityDocument> | undefined {
    const snapshot = activity?.publishedSnapshot || {};
    const clauses: any[] = [];
    if (snapshot.activityType) {
      clauses.push({ "publishedSnapshot.activityType": snapshot.activityType });
    }
    if (snapshot.category) {
      clauses.push({ "publishedSnapshot.category": snapshot.category });
    }
    if (snapshot.tags?.length) {
      clauses.push({
        "publishedSnapshot.tags": { $in: snapshot.tags.slice(0, 50) },
      });
    }
    if (!clauses.length) return undefined;
    return {
      ...this.publicationFilter(),
      _id: { $ne: activity._id },
      $or: clauses,
    };
  }

  private similarityScore(activity: any, candidate: any): number {
    const current = activity?.publishedSnapshot || {};
    const other = candidate?.publishedSnapshot || {};
    let score = 0;
    if (current.activityType && current.activityType === other.activityType)
      score += 5;
    if (current.category && current.category === other.category) score += 3;
    const tags = new Set(
      (current.tags || []).map((tag) => String(tag).toLowerCase())
    );
    score += (other.tags || []).filter((tag) =>
      tags.has(String(tag).toLowerCase())
    ).length;
    return score;
  }

  private buildSort(sort?: string): Record<string, 1 | -1> {
    if (sort === "oldest") return { publishedAt: 1, _id: 1 };
    if (sort === "endingSoon") {
      return { "publishedSnapshot.endDate": 1, publishedAt: -1, _id: 1 };
    }
    if (sort === "score") {
      return { "publishedSnapshot.isHot": -1, publishedAt: -1, _id: 1 };
    }
    return { publishedAt: -1, _id: -1 };
  }

  private async resolveAccessByTier(rows: any[], user?: Record<string, any>) {
    const tiers = Array.from(
      new Set(
        rows.flatMap((row) => [
          row.publishedMetadata?.accessTier,
          ...(row.publishedSnapshot?.review?.isLocked ||
          row.publishedSnapshot?.taskGuide?.isLocked
            ? ["prime"]
            : []),
        ])
      )
    ).filter(Boolean);
    const entries = await Promise.all(
      tiers.map(
        async (tier) =>
          [tier, await this.accessPolicy.resolve(tier, user)] as const
      )
    );
    return new Map(entries);
  }

  private async loadCanonicalProjects(rows: any[]): Promise<Map<string, any>> {
    const ids = Array.from(
      new Set(
        rows
          .map((row) => String(row.publishedMetadata?.canonicalProjectId || ""))
          .filter(Boolean)
      )
    );
    if (!ids.length) return new Map();
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const [projects, marketProjects, investorsByCanonicalId] =
      await Promise.all([
        this.canonicalProjectModel
          .find(
            { _id: { $in: objectIds } },
            {
              name: 1,
              slug: 1,
              symbol: 1,
              primaryWebsiteDomain: 1,
              metadata: 1,
            }
          )
          .lean()
          .exec(),
        this.marketProjectReadModel
          ? this.marketProjectReadModel
              .find(
                { canonicalProjectId: { $in: objectIds } },
                {
                  canonicalProjectId: 1,
                  symbol: 1,
                  logo: 1,
                  niche: 1,
                  category: 1,
                }
              )
              .lean()
              .exec()
          : Promise.resolve([]),
        this.loadCanonicalInvestors(objectIds),
      ]);
    const marketByCanonicalId = new Map(
      marketProjects.map((project: any) => [
        String(project.canonicalProjectId),
        project,
      ])
    );
    return new Map(
      projects.map((project: any) => [
        String(project._id),
        {
          ...project,
          marketProject: marketByCanonicalId.get(String(project._id)),
          investors: investorsByCanonicalId.get(String(project._id)) || [],
        },
      ])
    );
  }

  private async loadCanonicalInvestors(
    canonicalProjectIds: Types.ObjectId[]
  ): Promise<Map<string, any[]>> {
    if (
      !canonicalProjectIds.length ||
      !this.backerHoldingModel ||
      !this.backerReadModel
    ) {
      return new Map();
    }

    const holdings = await this.backerHoldingModel
      .find(
        { canonicalProjectId: { $in: canonicalProjectIds } },
        {
          canonicalProjectId: 1,
          backerId: 1,
          backerName: 1,
          backerType: 1,
          isLead: 1,
          lastRoundDate: 1,
          roundsCount: 1,
        }
      )
      .sort({ isLead: -1, lastRoundDate: -1, roundsCount: -1, _id: 1 })
      .lean()
      .exec();
    const backerIds = Array.from(
      new Set(holdings.map((holding: any) => String(holding.backerId || "")))
    )
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const backers = backerIds.length
      ? await this.backerReadModel
          .find(
            { backerId: { $in: backerIds } },
            {
              backerId: 1,
              name: 1,
              slug: 1,
              backerType: 1,
              website: 1,
              logoUrl: 1,
              avatarUrl: 1,
            }
          )
          .lean()
          .exec()
      : [];
    const backerById = new Map(
      backers.map((backer: any) => [String(backer.backerId), backer])
    );
    const investorsByCanonicalId = new Map<string, any[]>();

    for (const holding of holdings as any[]) {
      const canonicalProjectId = String(holding.canonicalProjectId || "");
      const backerId = String(holding.backerId || "");
      const backer = backerById.get(backerId);
      const name = this.firstMeaningfulString(backer?.name, holding.backerName);
      if (!canonicalProjectId || !name) continue;
      const logo = this.firstMeaningfulString(
        backer?.logoUrl,
        backer?.avatarUrl
      );
      const investor = {
        _id: backerId,
        id: backerId,
        name,
        slug: backer?.slug,
        type: backer?.backerType || holding.backerType,
        website: backer?.website,
        logo,
        image: logo,
        isLead: Boolean(holding.isLead),
      };
      const investors = investorsByCanonicalId.get(canonicalProjectId) || [];
      investors.push(investor);
      investorsByCanonicalId.set(canonicalProjectId, investors);
    }

    return investorsByCanonicalId;
  }

  private async loadFomoTaskCounts(
    rows: any[]
  ): Promise<Map<string, { count: number; available: number; xp: number }>> {
    const map = new Map<
      string,
      { count: number; available: number; xp: number }
    >();
    const ids = (rows || [])
      .map((row) => row?._id)
      .filter(Boolean)
      .map((id) => new Types.ObjectId(String(id)));
    if (!ids.length) return map;
    try {
      const rowsAgg = await this.activityModel.db
        .collection("tasks")
        .aggregate([
          {
            $match: {
              type: "default",
              v2ActivityId: { $in: ids },
              taskStatus: { $nin: ["archived", "draft"] },
            },
          },
          {
            $group: {
              _id: "$v2ActivityId",
              count: { $sum: 1 },
              available: {
                $sum: {
                  $cond: [
                    { $in: ["$taskStatus", ["active", "scheduled", "paused"]] },
                    1,
                    0,
                  ],
                },
              },
              xp: { $sum: { $ifNull: ["$points", 0] } },
            },
          },
        ])
        .toArray();
      rowsAgg.forEach((row: any) =>
        map.set(String(row._id), {
          count: Number(row.count || 0),
          available: Number(row.available || 0),
          xp: Number(row.xp || 0),
        })
      );
    } catch (error) {
      // Counts are a non-critical presentation concern — never break the feed.
    }
    return map;
  }

  // ── EL-1 comment counts (one thread per activity, no per-card request) ─────
  private commentPageKey(activityId: string): string {
    return `earlyland-activity-${activityId}`;
  }

  private async loadCommentCounts(rows: any[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    const ids = (rows || []).map((row) => String(row?._id || "")).filter(Boolean);
    if (!ids.length) return map;
    const keyToId = new Map<string, string>();
    ids.forEach((id) => keyToId.set(this.commentPageKey(id), id));
    try {
      const agg = await this.activityModel.db
        .collection("comments")
        .aggregate([
          { $match: { page: { $in: Array.from(keyToId.keys()) } } },
          { $group: { _id: "$page", n: { $sum: 1 } } },
        ])
        .toArray();
      agg.forEach((rowAgg: any) => {
        const activityId = keyToId.get(String(rowAgg._id));
        if (activityId) map.set(activityId, Number(rowAgg.n || 0));
      });
    } catch (error) {
      // Non-critical presentation concern — never break the feed/detail.
    }
    return map;
  }

  // ── EL-1 Activity Workspace (server-driven, canonical, detail-only) ────────
  private workspaceUserId(user?: Record<string, any>): Types.ObjectId | null {
    const id = String(user?._id || user?.id || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
  }

  private firstIsoDate(...values: any[]): string | undefined {
    for (const value of values) {
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
    return undefined;
  }

  private async loadWorkspaceState(
    row: any,
    user: Record<string, any> | undefined,
    fomoTasks: { count: number; available: number; xp: number }
  ) {
    const activityObjectId = new Types.ObjectId(String(row._id));
    const db = this.activityModel.db;
    const userId = this.workspaceUserId(user);
    const snapshot = row.publishedSnapshot || {};
    const nextDate = this.firstIsoDate(
      snapshot?.schedule?.endDate,
      snapshot?.endDate,
      snapshot?.schedule?.startDate,
      snapshot?.startDate,
      snapshot?.dates?.end,
      snapshot?.dates?.start
    );

    const workspace: any = {
      calendar: {
        added: false,
        eventsCount: 0,
        nextDate: nextDate || null,
        href: "/crypto/earlyland/calendar",
      },
      board: {
        added: false,
        cardId: null,
        status: null,
        notePreview: null,
        href: "/crypto/earlyland?tab=board",
      },
      fomoTasks: {
        count: Number(fomoTasks.count || 0),
        available: Number(fomoTasks.available || 0),
        inProgress: 0,
        review: 0,
        completed: 0,
        totalXp: Number(fomoTasks.xp || 0),
        href: "/crypto/earlyland?tab=tasks",
      },
    };

    // FOMO task counts are non-sensitive and shown even for anonymous viewers.
    if (!userId) return workspace;

    try {
      const [calendarRows, boardRows, progressRows] = await Promise.all([
        db
          .collection("cryptoactivitycalendaritems")
          .find({ userId, v2ActivityId: activityObjectId })
          .project({ _id: 1 })
          .toArray(),
        db
          .collection("cryptoactivityboardtasks")
          .find({ userId, v2ActivityId: activityObjectId })
          .sort({ updatedAt: -1 })
          .limit(1)
          .toArray(),
        db
          .collection("task_user_progress")
          .aggregate([
            { $match: { userId, activityId: activityObjectId } },
            { $group: { _id: "$state", n: { $sum: 1 } } },
          ])
          .toArray(),
      ]);

      workspace.calendar.added = calendarRows.length > 0;
      workspace.calendar.eventsCount = calendarRows.length;

      const boardCard = boardRows && boardRows[0];
      if (boardCard) {
        workspace.board.added = true;
        workspace.board.cardId = String(boardCard._id);
        workspace.board.status = boardCard.status || null;
        const note = String(boardCard.notes || "").trim();
        workspace.board.notePreview = note ? note.slice(0, 140) : null;
      }

      const byState = new Map<string, number>();
      progressRows.forEach((progressRow: any) =>
        byState.set(String(progressRow._id), Number(progressRow.n || 0))
      );
      workspace.fomoTasks.inProgress = byState.get("in_progress") || 0;
      workspace.fomoTasks.review =
        (byState.get("submitted") || 0) + (byState.get("under_review") || 0);
      workspace.fomoTasks.completed = byState.get("completed") || 0;
    } catch (error) {
      // Presentation-only — never break the activity detail response.
    }

    return workspace;
  }

  private toPublicActivity(
    row: any,
    canonicalProject: any,
    viewerAccess: FomoV2ActivityViewerAccess,
    interaction: FomoV2ActivityInteractionState = {},
    primeAccess?: FomoV2ActivityViewerAccess,
    fomoTasks: { count: number; available: number; xp: number } = {
      count: 0,
      available: 0,
      xp: 0,
    },
    commentsCount = 0
  ) {
    const snapshotContent = this.toLegacyCompatibleContent(
      sanitizeActivityContent(row.publishedSnapshot || {})
    );
    const compatibleContent = this.enrichWithCanonicalProject(
      snapshotContent,
      canonicalProject
    );
    const content = viewerAccess.allowed
      ? compatibleContent
      : this.redactPrimeContent(compatibleContent);
    const sectionPrimeAccess =
      row.publishedMetadata.accessTier === "prime" ? viewerAccess : primeAccess;
    const reviewAccess = this.sectionAccess(
      Boolean(compatibleContent.review?.isLocked),
      viewerAccess,
      sectionPrimeAccess
    );
    const taskGuideAccess = this.sectionAccess(
      Boolean(compatibleContent.taskGuide?.isLocked),
      viewerAccess,
      sectionPrimeAccess
    );
    if (!reviewAccess.allowed && content.review) {
      content.review = { isLocked: true };
    }
    if (!taskGuideAccess.allowed && content.taskGuide) {
      content.taskGuide = { isLocked: true };
      if (content.description) {
        content.description = {
          about: content.description.about,
          aboutHtml: content.description.aboutHtml,
        };
      }
      delete content.joinLink;
      delete content.links;
      delete content.videoGuides;
    }
    const canonicalLogo = this.canonicalLogo(canonicalProject);
    const canonicalSymbol = this.firstMeaningfulString(
      canonicalProject?.symbol,
      canonicalProject?.marketProject?.symbol
    );
    const canonicalCategory = this.canonicalCategory(canonicalProject);
    const canonical = canonicalProject
      ? {
          _id: String(canonicalProject._id),
          id: String(canonicalProject._id),
          name: canonicalProject.name,
          slug: canonicalProject.slug,
          symbol: canonicalSymbol,
          category: canonicalCategory,
          website:
            viewerAccess.allowed && canonicalProject.primaryWebsiteDomain
              ? `https://${canonicalProject.primaryWebsiteDomain}`
              : undefined,
          logo: canonicalLogo,
        }
      : null;

    const completedStepIds = Array.from(
      new Set(interaction.userState?.completedStepIds || [])
    );
    const stepsTotal = taskGuideAccess.allowed
      ? Number(content.taskGuide?.steps?.length || 0)
      : 0;
    const stepsCompleted = Math.min(completedStepIds.length, stepsTotal);
    const userState = {
      isFavourite: Boolean(interaction.userState?.isFavourite),
      reaction: interaction.userState?.reaction || null,
      isAddedToCalendar: Boolean(interaction.userState?.isAddedToCalendar),
      completedStepIds: taskGuideAccess.allowed ? completedStepIds : [],
      stepsCompleted: taskGuideAccess.allowed ? stepsCompleted : 0,
      stepsTotal,
      stepsProgress:
        stepsTotal > 0 ? Math.round((stepsCompleted / stepsTotal) * 100) : 0,
    };
    const reactionCounts = {
      like: Number(interaction.reactionCounts?.like || 0),
      dislike: Number(interaction.reactionCounts?.dislike || 0),
      hot: Number(interaction.reactionCounts?.hot || 0),
      interested: Number(interaction.reactionCounts?.interested || 0),
    };

    return {
      _id: String(row._id),
      id: String(row._id),
      legacyActivityId: row.legacyActivityId,
      legacyNumericId: row.legacyNumericId,
      parserActivityId: row.parserActivityId,
      slug: row.publishedMetadata.slug,
      canonicalProjectId: row.publishedMetadata.canonicalProjectId
        ? String(row.publishedMetadata.canonicalProjectId)
        : null,
      canonicalProject: canonical,
      lifecycleStatus: row.publishedMetadata.lifecycleStatus,
      status: row.publishedMetadata.lifecycleStatus,
      publicationStatus: row.publicationStatus,
      isSponsored: Boolean(row.isSponsored),
      sponsoredPriority: Number(row.sponsoredPriority || 0),
      accessTier: row.publishedMetadata.accessTier,
      nftRequired: row.publishedMetadata.accessTier === "prime",
      viewerAccess,
      contentAccess: {
        review: reviewAccess,
        taskGuide: taskGuideAccess,
      },
      isRedacted: viewerAccess.contentRedacted,
      sourceUrl:
        viewerAccess.allowed && taskGuideAccess.allowed
          ? row.sources?.[0]?.sourceUrl
          : undefined,
      userState,
      reactionCounts,
      likesCount: reactionCounts.like,
      dislikesCount: reactionCounts.dislike,
      // G4: ready-to-render FOMO (Team) Task counts so the feed/detail never
      // issues per-card requests. Counts are non-sensitive; task CONTENT stays
      // gated by the access engine elsewhere.
      hasFomoTasks: fomoTasks.count > 0,
      fomoTasksCount: fomoTasks.count,
      availableFomoTasksCount: fomoTasks.available,
      totalFomoTaskXp: fomoTasks.xp,
      // EL-1: one discussion thread per activity — ready-to-render count so the
      // feed shows "💬 N" without a per-card request. Comment CONTENT is fetched
      // lazily only on the detail Discussion section.
      commentsCount: Number(commentsCount || 0),
      hasComments: Number(commentsCount || 0) > 0,
      ...content,
    };
  }

  private async applyFavouriteFilter(
    match: FilterQuery<FomoV2ActivityDocument>,
    query: FomoV2ActivityPublicListQueryDto,
    user?: Record<string, any>
  ): Promise<void> {
    if (!query.favourite && !query.favorite) return;
    if (!user || !this.userStateResolver) {
      match._id = { $in: [] };
      return;
    }
    const ids = await this.userStateResolver.favoriteActivityIds(user);
    match._id = {
      $in: ids
        .filter((id) => Types.ObjectId.isValid(String(id)))
        .map((id) => new Types.ObjectId(String(id))),
    };
  }

  private async loadInteractionState(
    rows: any[],
    user?: Record<string, any>
  ): Promise<Record<string, FomoV2ActivityInteractionState>> {
    if (!this.userStateResolver || !rows.length) return {};
    return this.userStateResolver.enrich(
      rows.map((row) => String(row._id)),
      user
    );
  }

  private redactPrimeContent(
    content: FomoV2ActivityContent
  ): FomoV2ActivityContent {
    const {
      name,
      projectName,
      symbol,
      logo,
      projectLogo,
      score,
      activityType,
      category,
      difficulty,
      cost,
      timeEstimate,
      taskFrequency,
      isHot,
      ecosystem,
      platform,
      tags,
      startDate,
      endDate,
      approxStartDate,
      approxEndDate,
      timezone,
      participants,
      fundsRaised,
      relatedAssets,
    } = content;

    // Keep this as an explicit allowlist so newly introduced participation or
    // editorial fields fail closed for viewers without Prime entitlement.
    return this.cloneContent({
      name,
      projectName,
      symbol,
      logo,
      projectLogo,
      score,
      activityType,
      category,
      difficulty,
      cost,
      timeEstimate,
      taskFrequency,
      isHot,
      ecosystem,
      platform,
      tags,
      startDate,
      endDate,
      approxStartDate,
      approxEndDate,
      timezone,
      participants,
      fundsRaised,
      relatedAssets,
    });
  }

  private sectionAccess(
    isLocked: boolean,
    activityAccess: FomoV2ActivityViewerAccess,
    primeAccess?: FomoV2ActivityViewerAccess
  ): FomoV2ActivityViewerAccess {
    if (!activityAccess.allowed) return activityAccess;
    if (!isLocked) return { allowed: true, contentRedacted: false };
    return (
      primeAccess || {
        allowed: false,
        contentRedacted: true,
        reason: "entitlement_unavailable",
      }
    );
  }

  private cloneContent<T>(content: T): T {
    return JSON.parse(JSON.stringify(content || {}));
  }

  private toLegacyCompatibleContent(
    content: FomoV2ActivityContent
  ): FomoV2ActivityContent {
    const compatible = this.cloneContent(content);
    if (compatible.difficulty) {
      compatible.difficulty = this.capitalize(compatible.difficulty) as any;
    }
    if (compatible.taskFrequency) {
      compatible.taskFrequency = this.capitalize(
        compatible.taskFrequency
      ) as any;
    }
    return compatible;
  }

  private enrichWithCanonicalProject(
    content: FomoV2ActivityContent,
    canonicalProject: any
  ): FomoV2ActivityContent {
    if (!canonicalProject) return content;

    const enriched = this.cloneContent(content);
    const canonicalLogo = this.canonicalLogo(canonicalProject);
    const canonicalName = this.firstMeaningfulString(canonicalProject.name);
    const canonicalSymbol = this.firstMeaningfulString(
      canonicalProject.symbol,
      canonicalProject.marketProject?.symbol
    );
    if (canonicalName) {
      enriched.projectName = canonicalName;
    }
    if (canonicalLogo) {
      // A linked canonical project is the source of truth for project identity.
      enriched.logo = canonicalLogo;
      enriched.projectLogo = canonicalLogo;
    }
    if (canonicalSymbol) {
      enriched.symbol = canonicalSymbol;
    }
    // Never leak parser/raw investors once an activity is linked. The canonical
    // backer portfolio is the source of truth, including managed logos.
    enriched.investors = this.cloneContent(canonicalProject.investors || []);
    if (!this.isMeaningfulString(enriched.category)) {
      enriched.category = this.canonicalCategory(canonicalProject);
    }

    return enriched;
  }

  private canonicalLogo(canonicalProject: any): string | undefined {
    return this.firstMeaningfulString(
      canonicalProject?.marketProject?.logo,
      canonicalProject?.metadata?.logoUrl,
      canonicalProject?.metadata?.logo,
      canonicalProject?.metadata?.image
    );
  }

  private canonicalCategory(canonicalProject: any): string | undefined {
    const categories = Array.isArray(canonicalProject?.metadata?.categories)
      ? canonicalProject.metadata.categories
      : [];
    return this.firstMeaningfulString(
      canonicalProject?.metadata?.category,
      categories[0],
      canonicalProject?.marketProject?.category,
      canonicalProject?.marketProject?.niche
    );
  }

  private firstMeaningfulString(...values: any[]): string | undefined {
    for (const value of values) {
      if (this.isMeaningfulString(value)) return String(value).trim();
    }
    return undefined;
  }

  private isMeaningfulString(value: any): boolean {
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    return (
      Boolean(normalized) &&
      !["-", "tba", "undefined", "null"].includes(normalized)
    );
  }

  private capitalize(value: string): string {
    const text = String(value || "");
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text;
  }

  private normalizeLifecycleStatuses(
    value?: string
  ): FomoV2ActivityLifecycleStatus[] {
    return this.splitList(value)
      .map((item) => item.replace(/[\s_-]/g, "").toLowerCase())
      .map((item) => {
        if (item === "live" || item === "active") return "active";
        if (item === "upcoming") return "upcoming";
        if (item === "ended") return "ended";
        if (item === "canceled" || item === "cancelled") return "cancelled";
        return undefined;
      })
      .filter(Boolean) as FomoV2ActivityLifecycleStatus[];
  }

  private splitList(value?: string): string[] {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
