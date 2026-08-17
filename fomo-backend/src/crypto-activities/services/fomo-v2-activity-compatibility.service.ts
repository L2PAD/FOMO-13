import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import {
  FomoV2Activity,
  FomoV2ActivityAccessPolicyService,
  FomoV2ActivityContent,
  FomoV2ActivityDocument,
  FomoV2ActivityViewerAccess,
  resolveActivityByIdentity,
  sanitizeActivityContent,
} from "src/fomo-v2/domains/activities";

export type CryptoActivityViewer =
  | string
  | Record<string, any>
  | null
  | undefined;

export interface ResolvedCryptoActivityEntity {
  entityType: "fomo_v2";
  activityId: Types.ObjectId;
  v2ActivityId: Types.ObjectId;
  legacyActivityId?: Types.ObjectId;
  activity: Record<string, any>;
  viewerAccess: FomoV2ActivityViewerAccess;
}

export interface FomoV2ActivityResolutionMap {
  activities: Map<string, Record<string, any>>;
  knownV2Ids: Set<string>;
  blockedIds: Set<string>;
}

const COMPATIBILITY_PROJECTION = {
  _id: 1,
  slug: 1,
  legacyActivityId: 1,
  legacyNumericId: 1,
  parserActivityId: 1,
  canonicalProjectId: 1,
  lifecycleStatus: 1,
  publicationStatus: 1,
  accessTier: 1,
  publishedSnapshot: 1,
  publishedMetadata: 1,
  sources: 1,
  publishedAt: 1,
  hiddenAt: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

@Injectable()
export class FomoV2ActivityCompatibilityService {
  constructor(
    @InjectModel(FomoV2Activity.name)
    private readonly activityModel: Model<FomoV2ActivityDocument>,
    private readonly accessPolicy: FomoV2ActivityAccessPolicyService
  ) {}

  viewerUser(viewer: CryptoActivityViewer): Record<string, any> | undefined {
    if (!viewer) return undefined;
    if (typeof viewer === "string") return { _id: viewer };
    return viewer;
  }

  viewerId(viewer: CryptoActivityViewer): string | undefined {
    if (typeof viewer === "string") return viewer;
    const id = String(viewer?._id || viewer?.id || "").trim();
    return id || undefined;
  }

  async resolveForInteraction(
    idOrSlug: string,
    viewer: CryptoActivityViewer
  ): Promise<ResolvedCryptoActivityEntity | null> {
    const row = await resolveActivityByIdentity(
      idOrSlug,
      (identity, limit) =>
        this.activityModel
          .find(identity, COMPATIBILITY_PROJECTION)
          .limit(limit)
          .lean()
          .exec(),
      { slugField: "publishedMetadata.slug", decodeUri: true }
    );

    if (!row) return null;
    if (!this.isPublic(row)) {
      throw new NotFoundException("Crypto activity not found");
    }

    const viewerAccess = await this.resolveAccess(
      row.publishedMetadata.accessTier,
      viewer
    );
    if (!viewerAccess.allowed) this.throwAccessDenied(viewerAccess);
    const primeAccess = this.hasLockedSections(row)
      ? row.publishedMetadata.accessTier === "prime"
        ? viewerAccess
        : await this.resolveAccess("prime", viewer)
      : undefined;

    return {
      entityType: "fomo_v2",
      activityId: new Types.ObjectId(String(row._id)),
      v2ActivityId: new Types.ObjectId(String(row._id)),
      ...(Types.ObjectId.isValid(String(row.legacyActivityId || ""))
        ? { legacyActivityId: new Types.ObjectId(String(row.legacyActivityId)) }
        : {}),
      activity: this.toCompatibilityActivity(row, viewerAccess, primeAccess),
      viewerAccess,
    };
  }

  async resolveAccess(
    accessTier: "public" | "prime",
    viewer: CryptoActivityViewer
  ): Promise<FomoV2ActivityViewerAccess> {
    return this.accessPolicy.resolve(accessTier, this.viewerUser(viewer));
  }

  async requireAccess(
    accessTier: "public" | "prime",
    viewer: CryptoActivityViewer
  ): Promise<FomoV2ActivityViewerAccess> {
    const viewerAccess = await this.resolveAccess(accessTier, viewer);
    if (!viewerAccess.allowed) this.throwAccessDenied(viewerAccess);
    return viewerAccess;
  }

  async resolveObjectIds(
    activityIds: Array<any>,
    viewer: CryptoActivityViewer,
    options: { includeRedacted?: boolean } = {}
  ): Promise<FomoV2ActivityResolutionMap> {
    const objectIds = this.uniqueObjectIds(activityIds);
    if (!objectIds.length) {
      return {
        activities: new Map(),
        knownV2Ids: new Set(),
        blockedIds: new Set(),
      };
    }

    const requestedIds = objectIds.map((id) => String(id));

    const rows = await this.activityModel
      .find(
        {
          $or: [
            { _id: { $in: objectIds } },
            { legacyActivityId: { $in: requestedIds } },
            {
              $expr: {
                $in: [
                  {
                    $convert: {
                      input: "$legacyActivityId",
                      to: "string",
                      onError: null,
                      onNull: null,
                    },
                  },
                  requestedIds,
                ],
              },
            },
          ],
        },
        COMPATIBILITY_PROJECTION
      )
      .lean()
      .exec();
    const knownV2Ids = new Set<string>();
    const blockedIds = new Set<string>();
    const activities = new Map<string, Record<string, any>>();
    const accessByTier = new Map<string, FomoV2ActivityViewerAccess>();

    for (const row of rows) {
      const aliases = this.activityObjectIdAliases(row);
      for (const alias of aliases) knownV2Ids.add(alias);

      if (!this.isPublic(row)) {
        for (const alias of aliases) blockedIds.add(alias);
        continue;
      }

      const accessTier = row.publishedMetadata.accessTier;
      let viewerAccess = accessByTier.get(accessTier);
      if (!viewerAccess) {
        viewerAccess = await this.resolveAccess(accessTier, viewer);
        accessByTier.set(accessTier, viewerAccess);
      }

      if (!viewerAccess.allowed && !options.includeRedacted) {
        for (const alias of aliases) blockedIds.add(alias);
        continue;
      }

      let primeAccess: FomoV2ActivityViewerAccess | undefined;
      if (this.hasLockedSections(row)) {
        primeAccess =
          accessTier === "prime" ? viewerAccess : accessByTier.get("prime");
        if (!primeAccess) {
          primeAccess = await this.resolveAccess("prime", viewer);
          accessByTier.set("prime", primeAccess);
        }
      }
      const activity = this.toCompatibilityActivity(
        row,
        viewerAccess,
        primeAccess
      );
      for (const alias of aliases) activities.set(alias, activity);
    }

    return { activities, knownV2Ids, blockedIds };
  }

  async listCalendarActivities(
    start: Date,
    end: Date,
    viewer: CryptoActivityViewer
  ): Promise<Record<string, any>[]> {
    const match: FilterQuery<FomoV2ActivityDocument> = {
      ...this.publicationFilter(),
      $and: [
        ...(this.publicationFilter().$and || []),
        {
          $or: [
            {
              "publishedSnapshot.startDate": {
                $exists: true,
                $ne: null,
                $lt: end,
              },
              "publishedSnapshot.endDate": {
                $exists: true,
                $ne: null,
                $gte: start,
              },
            },
            {
              "publishedSnapshot.startDate": { $gte: start, $lt: end },
              $or: [
                { "publishedSnapshot.endDate": { $exists: false } },
                { "publishedSnapshot.endDate": null },
              ],
            },
            {
              "publishedSnapshot.endDate": { $gte: start, $lt: end },
              $or: [
                { "publishedSnapshot.startDate": { $exists: false } },
                { "publishedSnapshot.startDate": null },
              ],
            },
          ],
        },
      ],
    };
    const rows = await this.activityModel
      .find(match, COMPATIBILITY_PROJECTION)
      .sort({
        "publishedSnapshot.endDate": 1,
        "publishedSnapshot.startDate": 1,
        _id: 1,
      })
      .lean()
      .exec();
    const accessByTier = new Map<string, FomoV2ActivityViewerAccess>();
    const activities: Record<string, any>[] = [];

    for (const row of rows) {
      const accessTier = row.publishedMetadata.accessTier;
      let viewerAccess = accessByTier.get(accessTier);
      if (!viewerAccess) {
        viewerAccess = await this.resolveAccess(accessTier, viewer);
        accessByTier.set(accessTier, viewerAccess);
      }
      let primeAccess: FomoV2ActivityViewerAccess | undefined;
      if (this.hasLockedSections(row)) {
        primeAccess =
          accessTier === "prime" ? viewerAccess : accessByTier.get("prime");
        if (!primeAccess) {
          primeAccess = await this.resolveAccess("prime", viewer);
          accessByTier.set("prime", primeAccess);
        }
      }
      activities.push(
        this.toCompatibilityActivity(row, viewerAccess, primeAccess)
      );
    }

    return activities;
  }

  async getPublicFilters(limit = 9) {
    const normalizedLimit = Number.isFinite(Number(limit))
      ? Math.min(100, Math.max(1, Math.trunc(Number(limit))))
      : 9;
    const match = this.publicationFilter();
    const [total, activityTypes, categories] = await Promise.all([
      this.activityModel.countDocuments(match),
      this.activityModel.aggregate([
        { $match: match },
        { $project: { value: "$publishedSnapshot.activityType" } },
        {
          $match: {
            value: { $type: "string", $nin: ["", "TBA", "undefined"] },
          },
        },
        { $group: { _id: "$value", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      this.activityModel.aggregate([
        { $match: match },
        {
          $project: {
            values: {
              $setUnion: [
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$publishedSnapshot.category", null] },
                        { $ne: ["$publishedSnapshot.category", ""] },
                      ],
                    },
                    ["$publishedSnapshot.category"],
                    [],
                  ],
                },
                {
                  $cond: [
                    { $isArray: "$publishedSnapshot.ecosystem" },
                    "$publishedSnapshot.ecosystem",
                    [],
                  ],
                },
                {
                  $cond: [
                    { $isArray: "$publishedSnapshot.platform" },
                    "$publishedSnapshot.platform",
                    [],
                  ],
                },
              ],
            },
          },
        },
        { $unwind: "$values" },
        {
          $match: {
            values: { $type: "string", $nin: ["", "TBA", "undefined"] },
          },
        },
        { $group: { _id: "$values", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: normalizedLimit },
      ]),
    ]);
    const mapOptions = (items: Array<{ _id: string; count: number }>) => {
      const seen = new Set<string>();
      return items.reduce<
        Array<{ key: string; value: string; label: string; count: number }>
      >((result, item) => {
        const label = String(item?._id || "").trim();
        const key = label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (!key || seen.has(key)) return result;
        seen.add(key);
        result.push({
          key,
          value: label,
          label,
          count: Number(item.count || 0),
        });
        return result;
      }, []);
    };
    const typeOptions = mapOptions(activityTypes);
    const visibleTypes = typeOptions.slice(0, 5);
    const visibleTypeCount = visibleTypes.reduce(
      (sum, option) => sum + option.count,
      0
    );

    return {
      total,
      otherActivityCount: Math.max(0, total - visibleTypeCount),
      activityTypes: typeOptions.slice(0, normalizedLimit),
      categories: mapOptions(categories),
    };
  }

  relationId(record: any): string {
    return String(record?.v2ActivityId || record?.activityId || "");
  }

  relationFields(
    entity: ResolvedCryptoActivityEntity | null,
    legacyActivityId: any
  ) {
    const activityId = entity?.activityId || legacyActivityId;
    return entity
      ? {
          activityId,
          v2ActivityId: entity.v2ActivityId,
          activityEntity: "fomo_v2",
        }
      : {
          activityId,
          activityEntity: "legacy",
        };
  }

  private publicationFilter(): FilterQuery<FomoV2ActivityDocument> {
    return {
      publicationStatus: "published",
      $and: [
        {
          $or: [{ hiddenAt: { $exists: false } }, { hiddenAt: null }],
        },
        { publishedSnapshot: { $exists: true, $ne: null } },
        { publishedMetadata: { $exists: true, $ne: null } },
      ],
    };
  }

  private isPublic(row: any): boolean {
    return Boolean(
      row?.publicationStatus === "published" &&
        !row?.hiddenAt &&
        row?.publishedSnapshot &&
        row?.publishedMetadata
    );
  }

  private toCompatibilityActivity(
    row: any,
    viewerAccess: FomoV2ActivityViewerAccess,
    primeAccess?: FomoV2ActivityViewerAccess
  ): Record<string, any> {
    const sanitizedSnapshot = sanitizeActivityContent(
      this.cloneContent(row.publishedSnapshot)
    );
    const snapshot = viewerAccess.allowed
      ? sanitizedSnapshot
      : this.redactPrimeContent(sanitizedSnapshot);
    const sectionPrimeAccess =
      row.publishedMetadata.accessTier === "prime" ? viewerAccess : primeAccess;
    const reviewAccess = this.sectionAccess(
      Boolean(row.publishedSnapshot?.review?.isLocked),
      viewerAccess,
      sectionPrimeAccess
    );
    const taskGuideAccess = this.sectionAccess(
      Boolean(row.publishedSnapshot?.taskGuide?.isLocked),
      viewerAccess,
      sectionPrimeAccess
    );
    if (!reviewAccess.allowed && snapshot.review) {
      snapshot.review = { isLocked: true };
    }
    if (!taskGuideAccess.allowed && snapshot.taskGuide) {
      snapshot.taskGuide = { isLocked: true };
      if (snapshot.description) {
        snapshot.description = {
          about: snapshot.description.about,
          aboutHtml: snapshot.description.aboutHtml,
        };
      }
      delete snapshot.joinLink;
      delete snapshot.links;
      delete snapshot.videoGuides;
    }

    return {
      _id: new Types.ObjectId(String(row._id)),
      id: String(row._id),
      v2ActivityId: String(row._id),
      legacyActivityId: row.legacyActivityId,
      legacyNumericId: row.legacyNumericId,
      parserActivityId: row.parserActivityId,
      slug: row.publishedMetadata.slug,
      canonicalProjectId: row.publishedMetadata.canonicalProjectId
        ? String(row.publishedMetadata.canonicalProjectId)
        : null,
      lifecycleStatus: row.publishedMetadata.lifecycleStatus,
      status: row.publishedMetadata.lifecycleStatus,
      publicationStatus: row.publicationStatus,
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
      ...snapshot,
    };
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
    } = content || {};

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

  private hasLockedSections(row: any): boolean {
    return Boolean(
      row?.publishedSnapshot?.review?.isLocked ||
        row?.publishedSnapshot?.taskGuide?.isLocked
    );
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

  private cloneContent(content?: FomoV2ActivityContent): FomoV2ActivityContent {
    return JSON.parse(JSON.stringify(content || {}));
  }

  private uniqueObjectIds(values: Array<any>): Types.ObjectId[] {
    return Array.from(
      new Set(
        values
          .map((value) => String(value || ""))
          .filter((value) => Types.ObjectId.isValid(value))
      )
    ).map((value) => new Types.ObjectId(value));
  }

  private activityObjectIdAliases(row: any): string[] {
    return Array.from(
      new Set(
        [row?._id, row?.legacyActivityId]
          .map((value) => String(value || ""))
          .filter((value) => Types.ObjectId.isValid(value))
      )
    );
  }

  private throwAccessDenied(viewerAccess: FomoV2ActivityViewerAccess): never {
    throw new ForbiddenException({
      message: "Prime activity access is required",
      reason: viewerAccess.reason,
      viewerAccess,
    });
  }
}
