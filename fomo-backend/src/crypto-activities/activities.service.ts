import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import axios from "axios";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  CryptoActivity,
  CryptoActivityDocument,
} from "./models/crypto-activity.model";
import {
  CryptoActivityFavorite,
  CryptoActivityFavoriteDocument,
} from "./models/crypto-activity-favorite.model";
import {
  CryptoActivityReaction,
  CryptoActivityReactionDocument,
  CryptoActivityReactionType,
} from "./models/crypto-activity-reaction.model";
import {
  CryptoActivityReport,
  CryptoActivityReportDocument,
} from "./models/crypto-activity-report.model";
import {
  CryptoActivityCalendarItem,
  CryptoActivityCalendarItemDocument,
} from "./models/crypto-activity-calendar-item.model";
import {
  CryptoActivityBoard,
  CryptoActivityBoardDocument,
} from "./models/crypto-activity-board.model";
import {
  CryptoActivityBoardColumn,
  CryptoActivityBoardColumnDocument,
} from "./models/crypto-activity-board-column.model";
import {
  CryptoActivityBoardTask,
  CryptoActivityBoardTaskDocument,
} from "./models/crypto-activity-board-task.model";
import {
  CryptoActivityStepProgress,
  CryptoActivityStepProgressDocument,
} from "./models/crypto-activity-step-progress.model";
import { resolveCryptoActivityStatus } from "./utils/activity-status.util";
import {
  CryptoActivityBoardDto,
  CryptoActivityBoardColumnDto,
  CryptoActivityBoardQueryDto,
  CryptoActivityBoardTaskDto,
  CryptoActivityCalendarDto,
  CryptoActivityCalendarQueryDto,
  CryptoActivityFilterQueryDto,
  CryptoActivityListQueryDto,
  CryptoActivityReactionDto,
  CryptoActivityReportDto,
  CryptoActivityStepProgressDto,
  CryptoActivityUpdateDto,
} from "./dto/crypto-activity.dto";
import { Investor, InvestorDocument } from "src/investors/investor.model";
import { Funds, FundsDocument } from "src/funds/funds.model";
import {
  CryptoActivityViewer,
  FomoV2ActivityCompatibilityService,
  ResolvedCryptoActivityEntity,
} from "./services/fomo-v2-activity-compatibility.service";
import { Task, TaskDocument } from "src/tasks/models/task.model";
import {
  EarlylandTaskUserState,
  EarlylandTaskUserStateDocument,
  EarlylandTaskUserStatus,
} from "src/tasks/models/earlyland-task-user-state.model";
import { User, UserDocument } from "src/user/user.model";
import { XpLedgerService } from "src/xp/xp-ledger.service";
import { FomoV2ParserControlPolicyService } from "src/fomo-v2/domains/parser-control";

const SCORE_RANK: Record<string, number> = {
  NOT_RATED: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
};

const BOARD_STATUS_COLUMNS = [
  { id: "todo", title: "To Do", dotColor: "#2082ea" },
  { id: "in-progress", title: "In Progress", dotColor: "#ffc704" },
  { id: "completed", title: "Completed", dotColor: "#05a584" },
] as const;
const DEFAULT_BOARD_ITEMS = [
  { id: "all", label: "All Tasks", icon: "all" },
  { id: "airdrop", label: "Airdrop", icon: "airdrop" },
  { id: "testnet", label: "Testnet", icon: "testnet" },
  { id: "quest", label: "Quests", icon: "quest" },
  { id: "node", label: "Nodes", icon: "node" },
  { id: "other", label: "Others", icon: "other" },
] as const;
const ACTIVITY_REACTIONS: CryptoActivityReactionType[] = [
  "like",
  "dislike",
  "hot",
  "interested",
];
const MAX_CALENDAR_RANGE_MS = 366 * 24 * 60 * 60 * 1000;
const ADMIN_TASK_ID_PREFIX = "admin-task-";

type BoardStatusId = (typeof BOARD_STATUS_COLUMNS)[number]["id"];
type BoardIcon = (typeof DEFAULT_BOARD_ITEMS)[number]["icon"] | "folder";

type ResolvedActivityEntity = {
  activityId: mongoose.Types.ObjectId;
  v2ActivityId?: mongoose.Types.ObjectId;
  legacyActivityId?: mongoose.Types.ObjectId;
  activityEntity: "legacy" | "fomo_v2";
  activity: any;
};

type InvestorLookupRecord = {
  _id?: any;
  name?: string;
  normalizedName?: string;
  slug?: string;
  logo?: string;
  image?: string;
  img?: string;
  detailUrl?: string;
  website?: string;
  websiteUrl?: string;
  source?: string;
};

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);
  private readonly API_URL =
    "https://api2.icodrops.com/portfolio/api/activity/withPreset";

  constructor(
    @InjectModel(CryptoActivity.name)
    private activityModel: Model<CryptoActivityDocument>,
    @InjectModel(CryptoActivityFavorite.name)
    private favoriteModel: Model<CryptoActivityFavoriteDocument>,
    @InjectModel(CryptoActivityReaction.name)
    private reactionModel: Model<CryptoActivityReactionDocument>,
    @InjectModel(CryptoActivityReport.name)
    private reportModel: Model<CryptoActivityReportDocument>,
    @InjectModel(CryptoActivityCalendarItem.name)
    private calendarItemModel: Model<CryptoActivityCalendarItemDocument>,
    @InjectModel(CryptoActivityBoard.name)
    private boardModel: Model<CryptoActivityBoardDocument>,
    @InjectModel(CryptoActivityBoardColumn.name)
    private boardColumnModel: Model<CryptoActivityBoardColumnDocument>,
    @InjectModel(CryptoActivityBoardTask.name)
    private boardTaskModel: Model<CryptoActivityBoardTaskDocument>,
    @InjectModel(CryptoActivityStepProgress.name)
    private stepProgressModel: Model<CryptoActivityStepProgressDocument>,
    @InjectModel(Investor.name)
    private investorModel: Model<InvestorDocument>,
    @InjectModel(Funds.name)
    private fundsModel: Model<FundsDocument>,
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(EarlylandTaskUserState.name)
    private taskUserStateModel: Model<EarlylandTaskUserStateDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly xpLedger: XpLedgerService,
    private readonly fomoV2CompatibilityService: FomoV2ActivityCompatibilityService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {
    // this.fetchAndSaveAllActivities()
    // this.deleteAllActivities()
  }

  private async deleteAllActivities() {
    await this.activityModel.deleteMany({});
  }

  private getHeaders(): any {
    return {
      Accept: "*/*",
      "x-dropstab-api-key": process.env.DROPSTAB_KEY,
    };
  }

  private async safeRequest(
    url: string,
    params = {},
    headers = {}
  ): Promise<any> {
    try {
      const response = await axios.get(url, { params, headers });

      return response.data.data.content;
    } catch (error) {
      this.logger.error(`Request failed to ${url}: ${error.message}`);
      throw new Error(error.message || "Request failed");
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private toNonEmptyString(value: any): string {
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
    return typeof value === "string" ? value.trim() : "";
  }

  private normalizeInvestorName(value: any): string {
    return this.toNonEmptyString(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private slugify(value: any): string {
    return this.normalizeInvestorName(value).replace(/\s+/g, "-");
  }

  private normalizeStepId(value: any, index: number): string {
    return this.toNonEmptyString(value) || `step-${index + 1}`;
  }

  private extractNumberedSteps(value: any): string[] {
    const text = this.toNonEmptyString(value).replace(/\r\n/g, "\n");
    if (!text) return [];

    return Array.from(
      text.matchAll(/(?:^|\n)\s*\d+[.)]\s+([\s\S]*?)(?=(?:\n\s*\d+[.)]\s+)|$)/g)
    )
      .map((match) => this.toNonEmptyString(match[1]))
      .filter(Boolean);
  }

  private fallbackActivitySteps(activity: any): any[] {
    const numberedSources = [
      activity?.taskGuide?.description,
      activity?.description?.howToParticipate,
    ];

    for (const source of numberedSources) {
      const items = this.extractNumberedSteps(source);
      if (items.length >= 2) {
        return items.map((description, index) => ({
          id: `step-${index + 1}`,
          title: `Step ${index + 1}`,
          description,
        }));
      }
    }

    const requirements = Array.isArray(activity?.requirements)
      ? activity.requirements
          .map((item) => this.toNonEmptyString(item))
          .filter(Boolean)
      : [];

    if (requirements.length >= 2) {
      return requirements.map((description, index) => ({
        id: `step-${index + 1}`,
        title: `Step ${index + 1}`,
        description,
      }));
    }

    return [];
  }

  private activitySteps(activity: any): any[] {
    const explicitSteps = Array.isArray(activity?.taskGuide?.steps)
      ? activity.taskGuide.steps
      : [];
    const steps = explicitSteps.length
      ? explicitSteps
      : this.fallbackActivitySteps(activity);

    return steps
      .map((step, index) => {
        const title = this.toNonEmptyString(step?.title);
        const description = this.toNonEmptyString(step?.description);
        if (!title && !description) return null;

        return {
          ...step,
          id: this.normalizeStepId(step?.id, index),
          title: title || `Step ${index + 1}`,
          description,
        };
      })
      .filter(Boolean);
  }

  private withActivityStepIds(item: any): any {
    const steps = this.activitySteps(item);
    if (!steps.length) return item;

    return {
      ...item,
      taskGuide: {
        ...(item.taskGuide || {}),
        steps,
      },
    };
  }

  private activityStepUserState(
    activity: any,
    completedStepIds: string[] = []
  ) {
    const steps = this.activitySteps(activity);
    const validIds = new Set(steps.map((step) => step.id));
    const completedIds = Array.from(
      new Set(
        completedStepIds
          .map((id) => this.toNonEmptyString(id))
          .filter((id) => id && validIds.has(id))
      )
    );
    const total = steps.length;
    const completed = completedIds.length;

    return {
      completedStepIds: completedIds,
      stepsCompleted: completed,
      stepsTotal: total,
      stepsProgress: total ? Math.round((completed / total) * 100) : 0,
    };
  }

  private investorName(value: any): string {
    if (typeof value === "string") return value.trim();
    if (!value || typeof value !== "object") return "";

    return this.toNonEmptyString(
      value.name ||
        value.title ||
        value.label ||
        value.investorName ||
        value.fundName
    );
  }

  private investorSlug(value: any, fallbackName?: string): string {
    if (!value || typeof value !== "object")
      return fallbackName ? this.slugify(fallbackName) : "";

    return (
      this.toNonEmptyString(
        value.slug || value.investorSlug || value.sourceSlug
      ) || (fallbackName ? this.slugify(fallbackName) : "")
    );
  }

  private investorLogo(value: any): string {
    if (!value || typeof value !== "object") return "";

    return this.toNonEmptyString(
      value.logo || value.image || value.img || value.avatar
    );
  }

  private setInvestorLookup(
    lookup: Map<string, InvestorLookupRecord>,
    key: string,
    record: InvestorLookupRecord
  ): void {
    const normalizedKey = this.toNonEmptyString(key).toLowerCase();
    if (!normalizedKey) return;

    const current = lookup.get(normalizedKey);
    if (
      !current ||
      (!this.investorLogo(current) && this.investorLogo(record))
    ) {
      lookup.set(normalizedKey, record);
    }
  }

  private addInvestorLookupRecord(
    lookup: Map<string, InvestorLookupRecord>,
    records: InvestorLookupRecord[],
    record: InvestorLookupRecord
  ): void {
    const name = this.investorName(record);
    const slug = this.investorSlug(record, name);
    const normalizedName = this.normalizeInvestorName(
      record.normalizedName || name
    );

    records.push(record);
    this.setInvestorLookup(lookup, name, record);
    this.setInvestorLookup(lookup, normalizedName, record);
    this.setInvestorLookup(lookup, slug, record);
    this.setInvestorLookup(lookup, this.slugify(name), record);
  }

  private findInvestorMatch(
    investor: any,
    lookup: Map<string, InvestorLookupRecord>,
    records: InvestorLookupRecord[]
  ): InvestorLookupRecord | undefined {
    const name = this.investorName(investor);
    const slug = this.investorSlug(investor, name);
    const normalizedName = this.normalizeInvestorName(name);
    const directMatch =
      lookup.get(name.toLowerCase()) ||
      lookup.get(normalizedName) ||
      lookup.get(slug.toLowerCase()) ||
      lookup.get(this.slugify(name));

    if (directMatch) return directMatch;
    if (normalizedName.length < 4) return undefined;

    return records.find((record) => {
      const recordName = this.normalizeInvestorName(
        record.normalizedName || record.name
      );
      return Boolean(
        recordName &&
          (recordName.includes(normalizedName) ||
            normalizedName.includes(recordName))
      );
    });
  }

  private formatInvestorForUi(
    investor: any,
    match?: InvestorLookupRecord,
    index = 0
  ): Record<string, any> {
    const original = investor && typeof investor === "object" ? investor : {};
    const name =
      this.investorName(investor) ||
      this.investorName(match) ||
      `Investor ${index + 1}`;
    const slug =
      this.investorSlug(original, name) || this.investorSlug(match, name);
    const logo = this.investorLogo(original) || this.investorLogo(match);

    return {
      ...original,
      id: original.id || original._id || match?._id || slug || String(index),
      name,
      slug,
      logo,
      image: original.image || logo,
      img: original.img || logo,
      detailUrl: original.detailUrl || match?.detailUrl || "",
      website: original.website || match?.website || match?.websiteUrl || "",
      source: original.source || match?.source || "",
    };
  }

  private async enrichInvestorsForActivities<T extends Record<string, any>>(
    items: T[]
  ): Promise<T[]> {
    if (!items.length) return items;

    const rawInvestors = items.flatMap((item) =>
      Array.isArray(item.investors) ? item.investors : []
    );
    const names = Array.from(
      new Set(
        rawInvestors.map((item) => this.investorName(item)).filter(Boolean)
      )
    );
    if (!names.length) return items;

    const normalizedNames = Array.from(
      new Set(
        names.map((name) => this.normalizeInvestorName(name)).filter(Boolean)
      )
    );
    const slugs = Array.from(
      new Set(
        rawInvestors
          .map((item) => this.investorSlug(item, this.investorName(item)))
          .concat(names.map((name) => this.slugify(name)))
          .filter(Boolean)
      )
    );
    const nameRegexes = names
      .filter((name) => name.length >= 4)
      .slice(0, 100)
      .map((name) => new RegExp(this.escapeRegex(name), "i"));

    const [investorDocs, fundDocs] = await Promise.all([
      this.investorModel
        .find({
          $or: [
            { name: { $in: names } },
            { normalizedName: { $in: normalizedNames } },
            { slug: { $in: slugs } },
            ...(nameRegexes.length ? [{ name: { $in: nameRegexes } }] : []),
          ],
        })
        .select("name normalizedName slug logo detailUrl website source")
        .lean(),
      this.fundsModel
        .find({
          $or: [
            { name: { $in: names } },
            { slug: { $in: slugs } },
            ...(nameRegexes.length ? [{ name: { $in: nameRegexes } }] : []),
          ],
        })
        .select("name slug logo websiteUrl source")
        .lean(),
    ]);

    const lookup = new Map<string, InvestorLookupRecord>();
    const records: InvestorLookupRecord[] = [];

    for (const record of [...investorDocs, ...fundDocs]) {
      this.addInvestorLookupRecord(
        lookup,
        records,
        record as InvestorLookupRecord
      );
    }

    return items.map((item) => {
      if (!Array.isArray(item.investors) || !item.investors.length) return item;

      return {
        ...item,
        investors: item.investors.map((investor: any, index: number) =>
          this.formatInvestorForUi(
            investor,
            this.findInvestorMatch(investor, lookup, records),
            index
          )
        ),
      };
    });
  }

  private splitQueryValue(value?: string): string[] {
    if (!value || value === "all" || value === "default") return [];

    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private parseLimit(value?: number | string): number {
    const parsed = Number(value || 20);
    if (!Number.isFinite(parsed) || parsed <= 0) return 20;

    return Math.min(Math.floor(parsed), 100);
  }

  private parseOffset(value?: number | string): number {
    const parsed = Number(value || 0);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;

    return Math.floor(parsed);
  }

  private toObjectId(id?: string): mongoose.Types.ObjectId | null {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

    return new mongoose.Types.ObjectId(id);
  }

  private statusValues(status?: string): string[] {
    const statuses = this.splitQueryValue(status);
    if (!statuses.length) return [];

    return statuses.flatMap((item) => {
      const normalized = item.replace(/[\s_-]/g, "").toUpperCase();

      if (normalized === "ACTIVE" || normalized === "LIVE") {
        return ["LIVE", "ACTIVE", "Active"];
      }

      if (normalized === "UPCOMING") {
        return ["UPCOMING", "Upcoming"];
      }

      if (
        normalized === "ENDED" ||
        normalized === "CANCELED" ||
        normalized === "CANCELLED"
      ) {
        return ["ENDED", "CANCELED", "Ended"];
      }

      return [item, item.toUpperCase()];
    });
  }

  private activityTypeRegexes(type?: string): RegExp[] {
    const types = this.splitQueryValue(type);

    return types.map((item) => {
      const normalized = item.replace(/[\s_-]/g, "").toLowerCase();
      const map: Record<string, string> = {
        airdrop: "Airdrop",
        testnet: "Testnet",
        quest: "Quest",
        quests: "Quest",
        whitelist: "Whitelist",
        farming: "Farming",
        node: "Node",
        nodes: "Node",
        other: "Other",
        others: "Other",
      };
      const mapped =
        map[normalized] ||
        (normalized.includes("quest") ? "Quest" : "") ||
        (normalized.includes("farming") ? "Farming" : "") ||
        (normalized.includes("node") ? "Node" : "") ||
        (normalized.includes("airdrop") ? "Airdrop" : "") ||
        (normalized.includes("testnet") ? "Testnet" : "") ||
        (normalized.includes("whitelist") ? "Whitelist" : "");

      return new RegExp(`^${this.escapeRegex(mapped || item)}s?$`, "i");
    });
  }

  private buildFilter(query: CryptoActivityListQueryDto): Record<string, any> {
    const filter: Record<string, any> = {};

    if (this.isTruthy(query.hasInvestors)) {
      filter.investors = { $exists: true, $ne: [] };
    }

    const search = String(query.search || "").trim();
    if (search) {
      const regex = new RegExp(this.escapeRegex(search), "i");
      filter.$or = [
        { name: regex },
        { projectName: regex },
        { coinName: regex },
        { coinSlug: regex },
        { externalSlug: regex },
        { symbol: regex },
        { coinSymbol: regex },
        { "description.about": regex },
        { tags: regex },
      ];
    }

    const rawStatuses = this.splitQueryValue(query.status);
    const hasEndingSoon = rawStatuses.some(
      (status) => status.replace(/[\s_-]/g, "").toLowerCase() === "endingsoon"
    );
    const statuses = this.statusValues(
      rawStatuses
        .filter(
          (status) =>
            status.replace(/[\s_-]/g, "").toLowerCase() !== "endingsoon"
        )
        .join(",")
    );
    if (statuses.length) {
      filter.status = { $in: statuses };
    }

    if (hasEndingSoon) {
      const now = new Date();
      const soon = new Date(now);
      soon.setDate(soon.getDate() + 30);
      filter.endDate = { $gte: now, $lte: soon };
    }

    const typeRegexes = this.activityTypeRegexes(query.type);
    if (typeRegexes.length) {
      filter.activityType = { $in: typeRegexes };
    }

    const excludeTypeRegexes = this.activityTypeRegexes(query.excludeType);
    if (excludeTypeRegexes.length) {
      filter.activityType = {
        ...(filter.activityType || {}),
        $nin: excludeTypeRegexes,
      };
    }

    const categories = this.splitQueryValue(query.category);
    if (categories.length) {
      const regexes = categories.map(
        (item) => new RegExp(`^${this.escapeRegex(item)}$`, "i")
      );
      const categoryFilter = [
        { category: { $in: regexes } },
        { ecosystem: { $in: regexes } },
        { platform: { $in: regexes } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: categoryFilter }];
        delete filter.$or;
      } else {
        filter.$or = categoryFilter;
      }
    }

    const difficulties = this.splitQueryValue(query.difficulty);
    if (difficulties.length) {
      filter.difficulty = {
        $in: difficulties.map(
          (item) => new RegExp(`^${this.escapeRegex(item)}$`, "i")
        ),
      };
    }

    return filter;
  }

  private isTruthy(value?: boolean | string): boolean {
    return (
      value === true ||
      ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase())
    );
  }

  private normalizeFlagList(value: any): string[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => this.toNonEmptyString(item))
      .filter(Boolean)
      .slice(0, 50);
  }

  private normalizeBoardStatus(status?: string): BoardStatusId {
    return this.explicitBoardStatus(status) || "todo";
  }

  private explicitBoardStatus(status?: string): BoardStatusId | undefined {
    const normalized = String(status || "")
      .replace(/[\s_-]/g, "")
      .toLowerCase();

    if (normalized === "inprogress" || normalized === "progress")
      return "in-progress";
    if (
      normalized === "completed" ||
      normalized === "complete" ||
      normalized === "done"
    )
      return "completed";
    if (normalized === "todo" || normalized === "backlog") return "todo";

    return undefined;
  }

  private boardStatusTitle(status?: string): string {
    const statusId = this.normalizeBoardStatus(status);
    return (
      BOARD_STATUS_COLUMNS.find((column) => column.id === statusId)?.title ||
      "To Do"
    );
  }

  private normalizeActivityTypeValue(value?: any): string {
    const normalized = String(value || "")
      .replace(/[\s_-]/g, "")
      .toLowerCase();

    if (normalized.includes("airdrop")) return "airdrop";
    if (normalized.includes("testnet")) return "testnet";
    if (normalized.includes("quest")) return "quest";
    if (normalized.includes("node")) return "node";
    if (normalized.includes("whitelist")) return "whitelist";
    if (normalized.includes("farming")) return "farming";

    return "other";
  }

  private normalizeBoardCategory(
    value?: any
  ): "airdrop" | "testnet" | "quest" | "node" | "other" {
    const normalized = this.normalizeActivityTypeValue(value);

    if (
      normalized === "airdrop" ||
      normalized === "testnet" ||
      normalized === "quest" ||
      normalized === "node"
    ) {
      return normalized;
    }

    return "other";
  }

  private normalizeDifficultyValue(value?: any): "high" | "medium" | "low" {
    const normalized = String(value || "").toLowerCase();

    if (normalized.includes("hard") || normalized.includes("high"))
      return "high";
    if (normalized.includes("easy") || normalized.includes("low")) return "low";

    return "medium";
  }

  private activityTitle(activity: any): string {
    return (
      this.toNonEmptyString(activity?.name) ||
      this.toNonEmptyString(activity?.projectName) ||
      this.toNonEmptyString(activity?.coinName) ||
      this.toNonEmptyString(activity?.symbol) ||
      this.toNonEmptyString(activity?.coinSymbol) ||
      "Activity"
    );
  }

  private activityLogo(activity: any): string {
    return (
      this.toNonEmptyString(activity?.projectLogo) ||
      this.toNonEmptyString(activity?.logo) ||
      this.toNonEmptyString(activity?.relatedAssets?.[0]?.image) ||
      this.toNonEmptyString(activity?.relatedAssets?.[0]?.logo)
    );
  }

  private activityDescription(activity: any): string {
    if (typeof activity?.description === "string")
      return this.toNonEmptyString(activity.description);

    return (
      this.toNonEmptyString(activity?.description?.about) ||
      this.toNonEmptyString(activity?.description?.howToParticipate)
    );
  }

  private activityDescriptionHtml(activity: any): string {
    if (typeof activity?.description === "string") return "";

    return (
      this.toNonEmptyString(activity?.description?.aboutHtml) ||
      this.toNonEmptyString(activity?.description?.howToParticipateHtml)
    );
  }

  private activitySourceUrl(activity: any): string {
    const links = activity?.links;
    const firstLink = Array.isArray(links)
      ? links.find((link) => this.toNonEmptyString(link?.url))?.url
      : this.toNonEmptyString(links?.website) ||
        this.toNonEmptyString(links?.source) ||
        this.toNonEmptyString(links?.docs) ||
        this.toNonEmptyString(links?.custom?.[0]?.url);

    return (
      this.toNonEmptyString(activity?.sourceUrl) ||
      this.toNonEmptyString(activity?.originalUrl) ||
      this.toNonEmptyString(activity?.joinLink) ||
      this.toNonEmptyString(firstLink) ||
      this.toNonEmptyString(activity?.socialLinks?.website)
    );
  }

  private activityRewards(activity: any): any[] {
    if (Array.isArray(activity?.rewards) && activity.rewards.length)
      return activity.rewards;
    const reward = this.toNonEmptyString(
      activity?.rewardLabel || activity?.rewardAmount
    );
    return reward ? [reward] : [];
  }

  private activityRequirements(activity: any): string[] {
    if (Array.isArray(activity?.requirements) && activity.requirements.length) {
      return activity.requirements
        .map((item) => this.toNonEmptyString(item))
        .filter(Boolean);
    }

    const steps = Array.isArray(activity?.taskGuide?.steps)
      ? activity.taskGuide.steps
      : [];
    return steps
      .map((step) => this.toNonEmptyString(step?.description || step?.title))
      .filter(Boolean)
      .slice(0, 20);
  }

  private normalizeFilterKey(value: any): string {
    return this.toNonEmptyString(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private formatFilterOption(value: any, count = 0) {
    const label = this.toNonEmptyString(value);

    return {
      key: label,
      value: label,
      label,
      count,
    };
  }

  private parseDateOnly(value?: any): Date | null {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const text = String(value).trim();
    if (!text) return null;

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDateOnlyString(value?: any): string | undefined {
    const date = this.parseDateOnly(value);
    if (!date) return undefined;

    return date.toISOString().slice(0, 10);
  }

  private resolveActivityStatus(activity: {
    status?: any;
    startDate?: any;
    endDate?: any;
    approxStartDate?: any;
    approxEndDate?: any;
  }): string {
    return resolveCryptoActivityStatus({
      startDate: activity.startDate,
      endDate: activity.endDate,
      approxStartDate: activity.approxStartDate,
      approxEndDate: activity.approxEndDate,
      fallbackStatus: this.toNonEmptyString(activity.status),
    });
  }

  private getCalendarRange(query: CryptoActivityCalendarQueryDto): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (query.date) {
      start = this.parseDateOnly(query.date);
      end = start ? new Date(start) : null;
      if (end) end.setUTCDate(end.getUTCDate() + 1);
    } else if (query.month && /^\d{4}-\d{2}$/.test(query.month)) {
      const [year, month] = query.month.split("-").map((part) => Number(part));
      start = new Date(Date.UTC(year, month - 1, 1));
      end = new Date(Date.UTC(year, month, 1));
    } else {
      start = this.parseDateOnly(query.startDate);
      end = this.parseDateOnly(query.endDate);
      if (end)
        end = new Date(
          Date.UTC(
            end.getUTCFullYear(),
            end.getUTCMonth(),
            end.getUTCDate() + 1
          )
        );
    }

    if (!start)
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (!end)
      end = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)
      );
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException(
        "Calendar end date must be after start date"
      );
    }
    if (end.getTime() - start.getTime() > MAX_CALENDAR_RANGE_MS) {
      throw new BadRequestException("Calendar range cannot exceed 366 days");
    }

    return { start, end };
  }

  private isDateInRange(value: any, start: Date, end: Date): boolean {
    const date = this.parseDateOnly(value);
    return Boolean(date && date >= start && date < end);
  }

  private combineWithAnd(
    filter: Record<string, any>,
    condition: Record<string, any>
  ): Record<string, any> {
    if (!Object.keys(filter).length) return condition;

    return { $and: [filter, condition] };
  }

  private boardColumnByStatus(
    columns: CryptoActivityBoardColumnDocument[],
    status?: string
  ): CryptoActivityBoardColumnDocument | undefined {
    const statusId = this.normalizeBoardStatus(status);
    const title = this.boardStatusTitle(statusId);

    return (
      columns.find(
        (column) => this.explicitBoardStatus(column.title) === statusId
      ) ||
      columns.find((column) => column.title === title) ||
      columns[0]
    );
  }

  private sortValue(sort?: string): Record<string, 1 | -1> {
    const normalized = String(sort || "").toLowerCase();

    if (normalized === "oldest") return { createdAt: 1, statusUpdatedAt: 1 };
    if (normalized === "newest") return { createdAt: -1, statusUpdatedAt: -1 };
    if (normalized === "endingsoon") return { endDate: 1, statusUpdatedAt: -1 };
    if (normalized === "hot")
      return { isHot: -1, score: -1, statusUpdatedAt: -1 };
    if (normalized === "score") return { score: -1, statusUpdatedAt: -1 };

    return { statusUpdatedAt: -1, createdAt: -1 };
  }

  private normalizeLinks(links: Array<{ label: string; url: string }> = []) {
    const socialLinks: any = { custom: [] };

    for (const link of links) {
      const label = String(link?.label || "").toLowerCase();
      const url = String(link?.url || "");
      if (!url) continue;

      if (label.includes("twitter") || label === "x") socialLinks.twitter = url;
      else if (label.includes("telegram")) socialLinks.telegram = url;
      else if (label.includes("discord")) socialLinks.discord = url;
      else if (label.includes("doc") || label.includes("guide"))
        socialLinks.docs = url;
      else if (label.includes("website") || label.includes("site"))
        socialLinks.website = url;
      else socialLinks.custom.push({ label: link.label || "Link", url });
    }

    return socialLinks;
  }

  private parseMarkdownLinks(
    links: string[] = []
  ): Array<{ label: string; url: string }> {
    return links
      .map((link: string) => {
        const match = String(link).match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          return { label: match[1], url: match[2].split("|")[0] };
        }

        if (String(link).startsWith("http")) {
          return { label: "Link", url: String(link) };
        }

        return null;
      })
      .filter(Boolean);
  }

  private transformActivityData(raw: any): Partial<CryptoActivity> {
    const links = this.parseMarkdownLinks(raw.links || []);
    const relatedAssets = (raw.relatedAssets || []).map((a: any) => ({
      name: a.name,
      symbol: a.symbol,
      image: a.image,
      slug: a.slug,
    }));
    const coinSlug = raw.titleProject?.slug || "";
    const coinName = raw.titleProject?.name || "";
    const coinSymbol = raw.titleProject?.symbol || "";
    const logo =
      raw.titleProject?.image ||
      raw.titleProject?.logo ||
      relatedAssets[0]?.image ||
      "";
    const score = raw.score || "NOT_RATED";
    const activityType = raw.activityType?.name || "";
    const ecosystem = (raw.ecosystem || []).map((e: any) => e.displayName);
    const platform = (raw.launchpads || []).map((p: any) => p.name);
    const rewardLabel =
      raw.rewardDistributionApprox ||
      raw.rewardDistribution ||
      (raw.rewardAmount ? String(raw.rewardAmount) : "") ||
      (Array.isArray(raw.rewards) ? raw.rewards[0] : "");

    return {
      id: raw.id,
      slug: coinSlug || String(raw.id),
      name: coinName,
      symbol: coinSymbol,
      coinSlug,
      coinName,
      coinSymbol,
      logo,
      projectLogo: logo,
      score,
      status: this.resolveActivityStatus({
        status: raw.status,
        startDate: raw.activityFrom,
        endDate: raw.activityTo,
        approxStartDate: raw.activityFromCustom,
        approxEndDate: raw.activityToCustom,
      }),
      activityType,
      category: ecosystem[0] || platform[0] || activityType || "",
      ecosystem,
      platform,
      tags: (raw.tags || []).map((t: any) => t.name),
      startDate: raw.activityFrom ? new Date(raw.activityFrom) : null,
      endDate: raw.activityTo ? new Date(raw.activityTo) : null,
      approxStartDate: raw.activityFromCustom || "TBA",
      approxEndDate: raw.activityToCustom || "TBA",
      statusUpdatedAt: raw.statusUpdatedAt,
      description: {
        about: raw.about || "",
        howToParticipate: raw.howToParticipate || "",
      },
      rewardSupply: raw.rewardSupply ?? null,
      rewards: raw.rewards || [],
      rewardAmount: raw.rewardAmount ?? null,
      rewardLabel,
      rewardDistribution: raw.rewardDistribution ?? null,
      rewardDistributionApprox: raw.rewardDistributionApprox ?? null,
      participants: raw.participants ?? null,
      relatedAssets,
      fundsRaised: raw.relatedAssets?.length
        ? raw.relatedAssets[0]?.fundsRaised || 0
        : 0,
      joinLink: raw.participationLink || "",
      links,
      socialLinks: this.normalizeLinks(links),
      videoGuides: raw.videoGuides || [],
      taskGuide: {
        title: coinName ? `How to participate in ${coinName}` : "",
        description: raw.howToParticipate || "",
        ctaLabel: raw.participationLink ? "Open activity" : "",
        ctaUrl: raw.participationLink || "",
        steps: (raw.videoGuides || []).map((video: string, index: number) => ({
          title: `Guide ${index + 1}`,
          video,
        })),
      },
      timeline: [
        raw.activityFrom
          ? { title: "Start", date: new Date(raw.activityFrom) }
          : null,
        raw.activityTo
          ? { title: "End", date: new Date(raw.activityTo) }
          : null,
      ].filter(Boolean),
      isHot: SCORE_RANK[String(score).toUpperCase()] >= SCORE_RANK.HIGH,
      createdAt: raw.createdAt,
      updatedAt: raw.updated,
      investors: raw.titleProject?.investors || [],
    };
  }

  @Cron("0 */30 * * * *")
  public async refreshActivityStatusesByDateCron(): Promise<void> {
    await this.refreshActivityStatusesByDate("cron");
  }

  public async refreshActivityStatusesByDate(trigger = "manual") {
    if (
      this.parserControlPolicy &&
      !(await this.parserControlPolicy.canWriteDomainData("activities:legacy"))
    ) {
      this.logger.log(
        `Crypto activity status refresh skipped (${trigger}): parser control blocks writes`
      );
      return { scanned: 0, updated: 0, blocked: "parser_control" };
    }
    const docs = await this.activityModel
      .find({})
      .select("_id status startDate endDate approxStartDate approxEndDate")
      .lean();
    const now = Date.now();
    const operations = docs.reduce<any[]>((acc, activity) => {
      const nextStatus = this.resolveActivityStatus(activity);
      if (!nextStatus || this.toNonEmptyString(activity.status) === nextStatus)
        return acc;

      acc.push({
        updateOne: {
          filter: { _id: activity._id },
          update: {
            $set: {
              status: nextStatus,
              statusUpdatedAt: now,
              updatedAt: now,
            },
          },
        },
      });

      return acc;
    }, []);

    if (!operations.length) {
      this.logger.log(
        `Crypto activity status refresh skipped (${trigger}): no changes`
      );
      return { scanned: docs.length, updated: 0 };
    }

    const result: any = await this.activityModel.bulkWrite(operations, {
      ordered: false,
      timestamps: false,
    } as any);
    const updated =
      result.modifiedCount || result.upsertedCount || operations.length;
    this.logger.log(
      `Crypto activity status refresh finished (${trigger}): scanned=${docs.length}, updated=${updated}`
    );

    return { scanned: docs.length, updated };
  }

  private async fetchActivitiesFromApi(): Promise<any[]> {
    try {
      this.logger.log("Fetching activities from API...");
      const data = await axios.post(this.API_URL, {
        sortField: "statusUpdatedAt",
        order: "DESC",
        page: 0,
        size: 5,
        filters: {
          isDraft: false,
          statusesExcluded: ["ENDED"],
        },
      });

      if (!data?.data?.activities) {
        return [];
      }

      this.logger.log(
        `Successfully fetched ${data.data.activities.content.length} activities`
      );
      return data.data.activities.content || [];
    } catch (error) {
      this.logger.error(`Failed to fetch activities: ${error.message}`);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  public async fetchAndSaveAllActivities(): Promise<CryptoActivity[]> {
    try {
      if (process.env.LEGACY_CRYPTO_ACTIVITIES_SYNC_ENABLED !== "true") {
        this.logger.log(
          "Legacy ICODrops activity sync skipped: FOMO v2 activities pipeline is authoritative"
        );
        return [];
      }

      if (process.env.IS_LOCAL_RUN === "true") return [];
      if (
        this.parserControlPolicy &&
        !(await this.parserControlPolicy.canWriteDomainData(
          "activities:icodrops"
        ))
      ) {
        this.logger.log(
          "Legacy ICODrops activity sync skipped: parser control blocks writes"
        );
        return [];
      }

      const apiActivities = await this.fetchActivitiesFromApi();
      const savedActivities: CryptoActivity[] = [];

      for (let i = 0; i < apiActivities.length; i++) {
        const apiActivity = apiActivities[i];
        try {
          const activityData = this.transformActivityData(apiActivity);
          const savedActivity = await this.activityModel.findOneAndUpdate(
            { id: activityData.id },
            activityData,
            { upsert: true, new: true }
          );

          savedActivities.push(savedActivity);
        } catch (error) {
          this.logger.error(
            `Error saving activity ${apiActivity.id}: ${error.message}`
          );
        }
      }

      this.logger.log(
        `Successfully saved ${savedActivities.length} activities`
      );
      return savedActivities;
    } catch (error) {
      this.logger.error(`Failed to save activities: ${error.message}`);
      throw error;
    }
  }

  private async attachUserState(items: any[], userId?: string): Promise<any[]> {
    const normalizedItems = items.map((item) => this.withActivityStepIds(item));
    if (!normalizedItems.length) return normalizedItems;

    const activityIds = normalizedItems
      .map((item) => this.toObjectId(String(item._id)))
      .filter(Boolean);

    // ── FOMO Tasks presentation counts (canonical, per v2 activity) ──────────
    // Feed/Prime cards and Activity Detail receive ready-to-render counts so the
    // frontend never issues per-card task requests. Access content stays gated
    // by the access engine elsewhere; here we only expose non-sensitive counts.
    const v2Ids = normalizedItems
      .map((item) => this.toObjectId(String(item.v2ActivityId || "")))
      .filter(Boolean);
    const fomoByActivity = new Map<
      string,
      { count: number; available: number; xp: number }
    >();
    if (v2Ids.length) {
      const fomoRows = await this.taskModel.aggregate([
        {
          $match: {
            type: "default",
            v2ActivityId: { $in: v2Ids },
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
      ]);
      fomoRows.forEach((row: any) =>
        fomoByActivity.set(String(row._id), {
          count: Number(row.count || 0),
          available: Number(row.available || 0),
          xp: Number(row.xp || 0),
        })
      );
    }

    const reactionCountRows = activityIds.length
      ? await this.reactionModel.aggregate([
          { $match: { activityId: { $in: activityIds } } },
          {
            $group: {
              _id: { activityId: "$activityId", reaction: "$reaction" },
              count: { $sum: 1 },
            },
          },
        ])
      : [];
    const reactionCountsByActivity = new Map<
      string,
      Record<CryptoActivityReactionType, number>
    >();

    reactionCountRows.forEach((row) => {
      const activityId = String(row?._id?.activityId || "");
      const reaction = row?._id?.reaction as CryptoActivityReactionType;
      if (!activityId || !ACTIVITY_REACTIONS.includes(reaction)) return;

      const counts = reactionCountsByActivity.get(activityId) || {
        like: 0,
        dislike: 0,
        hot: 0,
        interested: 0,
      };
      counts[reaction] = Number(row.count || 0);
      reactionCountsByActivity.set(activityId, counts);
    });

    const withReactionCounts = (item: any) => {
      const counts = reactionCountsByActivity.get(String(item._id)) || {
        like: 0,
        dislike: 0,
        hot: 0,
        interested: 0,
      };

      const fomo = fomoByActivity.get(String(item.v2ActivityId || "")) || {
        count: 0,
        available: 0,
        xp: 0,
      };

      return {
        ...item,
        reactionCounts: counts,
        likesCount: counts.like,
        dislikesCount: counts.dislike,
        hasFomoTasks: fomo.count > 0,
        fomoTasksCount: fomo.count,
        availableFomoTasksCount: fomo.available,
        totalFomoTaskXp: fomo.xp,
      };
    };
    const itemsWithReactionCounts = normalizedItems.map(withReactionCounts);

    if (!userId || !activityIds.length) {
      return itemsWithReactionCounts.map((item) => ({
        ...item,
        userState: {
          isFavourite: false,
          reaction: null,
          isAddedToCalendar: false,
          ...this.activityStepUserState(item),
        },
      }));
    }

    const userObjectId = this.toObjectId(userId);
    if (!userObjectId) {
      return itemsWithReactionCounts.map((item) => ({
        ...item,
        userState: {
          isFavourite: false,
          reaction: null,
          isAddedToCalendar: false,
          ...this.activityStepUserState(item),
        },
      }));
    }

    const [favorites, reactions, calendarItems, stepProgress] =
      await Promise.all([
        this.favoriteModel
          .find({ userId: userObjectId, activityId: { $in: activityIds } })
          .lean(),
        this.reactionModel
          .find({ userId: userObjectId, activityId: { $in: activityIds } })
          .lean(),
        this.calendarItemModel
          .find({ userId: userObjectId, activityId: { $in: activityIds } })
          .lean(),
        this.stepProgressModel
          .find({ userId: userObjectId, activityId: { $in: activityIds } })
          .lean(),
      ]);

    const favoriteIds = new Set(
      favorites.map((item) => String(item.activityId))
    );
    const calendarIds = new Set(
      calendarItems.map((item) => String(item.activityId))
    );
    const reactionByActivity = new Map(
      reactions.map((item) => [String(item.activityId), item.reaction])
    );
    const stepProgressByActivity = new Map(
      stepProgress.map((item) => [
        String(item.activityId),
        item.completedStepIds || [],
      ])
    );

    return itemsWithReactionCounts.map((item) => {
      const activityId = String(item._id);

      return {
        ...item,
        userState: {
          isFavourite: favoriteIds.has(activityId),
          reaction: reactionByActivity.get(activityId) || null,
          isAddedToCalendar: calendarIds.has(activityId),
          ...this.activityStepUserState(
            item,
            stepProgressByActivity.get(activityId)
          ),
        },
      };
    });
  }

  public async getActivities(
    query: CryptoActivityListQueryDto,
    userId?: string
  ) {
    const limit = this.parseLimit(query.limit);
    const offset = this.parseOffset(query.offset);
    const filter = this.buildFilter(query);
    const sort = this.sortValue(query.sort);
    const favouriteOnly = this.isTruthy(query.favourite || query.favorite);

    if (favouriteOnly) {
      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) {
        return {
          items: [],
          total: 0,
          limit,
          offset,
          hasMore: false,
        };
      }

      const favorites = await this.favoriteModel
        .find({ userId: userObjectId })
        .select("activityId")
        .lean();
      const activityIds = favorites
        .map((item) => this.toObjectId(String(item.activityId)))
        .filter(Boolean);

      if (!activityIds.length) {
        return {
          items: [],
          total: 0,
          limit,
          offset,
          hasMore: false,
        };
      }

      filter._id = { $in: activityIds };
    }

    const [total, docs] = await Promise.all([
      this.activityModel.countDocuments(filter),
      this.activityModel
        .find(filter)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);

    const enrichedDocs = await this.enrichInvestorsForActivities(docs);
    const items = await this.attachUserState(enrichedDocs, userId);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  public async getFilters(query: CryptoActivityFilterQueryDto = {}) {
    const limit = this.parseLimit(query.limit || 9);
    const [total, activityTypes, categories] = await Promise.all([
      this.activityModel.countDocuments({}),
      this.activityModel.aggregate([
        {
          $project: {
            value: "$activityType",
          },
        },
        {
          $match: {
            value: { $type: "string", $nin: ["", "TBA", "undefined"] },
          },
        },
        {
          $group: {
            _id: "$value",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
      ]),
      this.activityModel.aggregate([
        {
          $project: {
            values: {
              $setUnion: [
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$category", null] },
                        { $ne: ["$category", ""] },
                      ],
                    },
                    ["$category"],
                    [],
                  ],
                },
                {
                  $cond: [
                    { $isArray: "$ecosystem" },
                    "$ecosystem",
                    {
                      $cond: [
                        {
                          $and: [
                            { $ne: ["$ecosystem", null] },
                            { $ne: ["$ecosystem", ""] },
                          ],
                        },
                        ["$ecosystem"],
                        [],
                      ],
                    },
                  ],
                },
                {
                  $cond: [
                    { $isArray: "$platform" },
                    "$platform",
                    {
                      $cond: [
                        {
                          $and: [
                            { $ne: ["$platform", null] },
                            { $ne: ["$platform", ""] },
                          ],
                        },
                        ["$platform"],
                        [],
                      ],
                    },
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
        {
          $group: {
            _id: "$values",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: limit },
      ]),
    ]);

    const mapOptions = (items: Array<{ _id: string; count: number }>) => {
      const seen = new Set<string>();

      return items.reduce<
        Array<{ key: string; value: string; label: string; count: number }>
      >((acc, item) => {
        const option = this.formatFilterOption(item._id, item.count);
        const normalizedKey = this.normalizeFilterKey(option.label);
        if (!normalizedKey || seen.has(normalizedKey)) return acc;

        seen.add(normalizedKey);
        acc.push(option);
        return acc;
      }, []);
    };
    const activityTypeOptions = mapOptions(activityTypes);
    const visibleTypeOptions = activityTypeOptions
      .filter((option) => {
        const normalized = this.normalizeFilterKey(option.label).replace(
          /-/g,
          ""
        );
        return normalized !== "other" && normalized !== "others";
      })
      .slice(0, 5);
    const visibleTypeCount = visibleTypeOptions.reduce(
      (sum, option) => sum + option.count,
      0
    );

    return {
      total,
      otherActivityCount: Math.max(0, total - visibleTypeCount),
      activityTypes: activityTypeOptions.slice(0, limit),
      categories: mapOptions(categories),
    };
  }

  public async getLatestActivities(limit: number = 5): Promise<any[]> {
    try {
      const docs = await this.activityModel
        .find({
          investors: { $exists: true, $ne: [] },
        })
        .sort({ statusUpdatedAt: -1 })
        .limit(limit)
        .lean();

      return this.enrichInvestorsForActivities(docs);
    } catch (error) {
      this.logger.error(
        `Failed to fetch latest activities with rewardAmount: ${error.message}`
      );
      throw error;
    }
  }

  private async findActivityByAnyId(
    id: string
  ): Promise<CryptoActivityDocument> {
    const query: any[] = [
      { slug: id },
      { externalSlug: id },
      { coinSlug: id },
      { parserActivityId: id },
    ];
    const objectId = this.toObjectId(id);
    const numericId = Number(id);

    if (objectId) query.push({ _id: objectId });
    if (Number.isFinite(numericId)) query.push({ id: numericId });

    const activity = await this.activityModel.findOne({ $or: query });
    if (!activity) {
      throw new NotFoundException("Crypto activity not found");
    }

    return activity;
  }

  private async resolveActivityForInteraction(
    id: string,
    viewer: CryptoActivityViewer
  ): Promise<ResolvedActivityEntity> {
    const v2Activity: ResolvedCryptoActivityEntity | null =
      await this.fomoV2CompatibilityService.resolveForInteraction(id, viewer);
    if (v2Activity) {
      return {
        activityId: v2Activity.activityId,
        v2ActivityId: v2Activity.v2ActivityId,
        legacyActivityId: v2Activity.legacyActivityId,
        activityEntity: "fomo_v2",
        activity: v2Activity.activity,
      };
    }

    if (!this.legacyPublicFallbackEnabled()) {
      throw new NotFoundException("Crypto activity not found");
    }

    const legacyActivity = await this.findActivityByAnyId(id);
    await this.fomoV2CompatibilityService.requireAccess(
      legacyActivity.nftRequired ? "prime" : "public",
      viewer
    );
    return {
      activityId: legacyActivity._id,
      activityEntity: "legacy",
      activity: legacyActivity,
    };
  }

  private legacyPublicFallbackEnabled(): boolean {
    return (
      process.env.LEGACY_CRYPTO_ACTIVITY_PUBLIC_FALLBACK_ENABLED === "true"
    );
  }

  private activityRelationQuery(
    userId: mongoose.Types.ObjectId,
    entity: ResolvedActivityEntity
  ): Record<string, any> {
    const relations: Record<string, any>[] = [];
    if (entity.v2ActivityId) {
      relations.push({ v2ActivityId: entity.v2ActivityId });
    }
    relations.push({ activityId: { $in: this.activityRelationIds(entity) } });
    return { userId, $or: relations };
  }

  private activityRelationIds(
    entity: ResolvedActivityEntity
  ): mongoose.Types.ObjectId[] {
    return Array.from(
      new Map(
        [entity.activityId, entity.v2ActivityId, entity.legacyActivityId]
          .filter(Boolean)
          .map((value) => [String(value), value as mongoose.Types.ObjectId])
      ).values()
    );
  }

  private activityRelationFields(entity: ResolvedActivityEntity) {
    return {
      activityId: entity.v2ActivityId || entity.activityId,
      ...(entity.v2ActivityId ? { v2ActivityId: entity.v2ActivityId } : {}),
      activityEntity: entity.activityEntity,
    };
  }

  private async upsertActivityRelation(
    model: any,
    userId: mongoose.Types.ObjectId,
    entity: ResolvedActivityEntity,
    fields: Record<string, any>
  ): Promise<any> {
    const identityQuery = this.activityRelationQuery(userId, entity);
    const rows = await model
      .find(identityQuery, { _id: 1, activityId: 1, v2ActivityId: 1 })
      .sort({ updatedAt: -1, createdAt: -1, _id: 1 })
      .lean()
      .exec();
    const canonicalId = String(entity.v2ActivityId || entity.activityId);
    const survivor =
      rows.find((row: any) => String(row.v2ActivityId || "") === canonicalId) ||
      rows[0];

    if (survivor) {
      const duplicateIds = rows
        .filter((row: any) => String(row._id) !== String(survivor._id))
        .map((row: any) => row._id);
      if (duplicateIds.length) {
        await model.deleteMany({ _id: { $in: duplicateIds }, userId });
      }
      return model.findOneAndUpdate(
        { _id: survivor._id, userId },
        { $set: { userId, ...this.activityRelationFields(entity), ...fields } },
        { new: true }
      );
    }

    return model.findOneAndUpdate(
      identityQuery,
      { $set: { userId, ...this.activityRelationFields(entity), ...fields } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  public async getActivityDetail(id: string, userId?: string) {
    const activity = await this.findActivityByAnyId(id);
    const [enrichedActivity] = await this.enrichInvestorsForActivities([
      activity.toObject(),
    ]);
    const [detail] = await this.attachUserState([enrichedActivity], userId);

    const similarFilter: any = {
      _id: { $ne: activity._id },
    };

    if (activity.activityType) {
      similarFilter.activityType = activity.activityType;
    } else if (activity.category) {
      similarFilter.category = activity.category;
    } else if (activity.tags?.length) {
      similarFilter.tags = { $in: activity.tags };
    }

    const similar = await this.activityModel
      .find(similarFilter)
      .sort({ isHot: -1, statusUpdatedAt: -1 })
      .limit(3)
      .lean();

    const enrichedSimilar = await this.enrichInvestorsForActivities(similar);
    const similarProjects = await this.attachUserState(enrichedSimilar, userId);

    return {
      ...detail,
      similarProjects,
    };
  }

  public async updateActivity(
    id: string,
    dto: CryptoActivityUpdateDto,
    userId?: string
  ) {
    const activity = await this.findActivityByAnyId(id);
    const update: Record<string, any> = {};
    const activityObject: any = activity.toObject();
    const manualFields = new Set<string>(
      activityObject.manualOverrides?.fields || []
    );

    if (dto.nftRequired !== undefined) {
      update.nftRequired = this.isTruthy(dto.nftRequired);
      manualFields.add("nftRequired");
    }

    if (dto.flags !== undefined) {
      update.flags = {
        green: this.normalizeFlagList(dto.flags?.green),
        yellow: this.normalizeFlagList(dto.flags?.yellow),
        red: this.normalizeFlagList(dto.flags?.red),
      };
      manualFields.add("flags");
    }

    if (!Object.keys(update).length) {
      throw new BadRequestException("No crypto activity fields to update");
    }

    const userObjectId = this.toObjectId(userId);
    update.manualOverrides = {
      ...(activityObject.manualOverrides || {}),
      fields: Array.from(manualFields),
      updatedAt: new Date(),
      updatedBy:
        userObjectId || activityObject.manualOverrides?.updatedBy || null,
    };

    const updated = await this.activityModel
      .findByIdAndUpdate(activity._id, { $set: update }, { new: true })
      .lean();

    if (!updated) throw new NotFoundException("Crypto activity not found");

    return updated;
  }

  public async favoriteActivity(id: string, viewer: CryptoActivityViewer) {
    const entity = await this.resolveActivityForInteraction(id, viewer);
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (!userObjectId) throw new BadRequestException("Invalid user");

    await this.upsertActivityRelation(
      this.favoriteModel,
      userObjectId,
      entity,
      {}
    );

    return { isFavourite: true };
  }

  public async unfavoriteActivity(id: string, viewer: CryptoActivityViewer) {
    const entity = await this.resolveActivityForInteraction(id, viewer);
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (!userObjectId) throw new BadRequestException("Invalid user");

    await this.favoriteModel.deleteMany(
      this.activityRelationQuery(userObjectId, entity)
    );

    return { isFavourite: false };
  }

  public async reactToActivity(
    id: string,
    viewer: CryptoActivityViewer,
    dto: CryptoActivityReactionDto
  ) {
    if (!ACTIVITY_REACTIONS.includes(dto.reaction)) {
      throw new BadRequestException("Unknown reaction");
    }

    const entity = await this.resolveActivityForInteraction(id, viewer);
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (!userObjectId) throw new BadRequestException("Invalid user");

    const reaction = await this.upsertActivityRelation(
      this.reactionModel,
      userObjectId,
      entity,
      { reaction: dto.reaction }
    );

    return reaction;
  }

  public async removeReactionFromActivity(
    id: string,
    viewer: CryptoActivityViewer
  ) {
    const entity = await this.resolveActivityForInteraction(id, viewer);
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (!userObjectId) throw new BadRequestException("Invalid user");

    await this.reactionModel.deleteMany(
      this.activityRelationQuery(userObjectId, entity)
    );

    return { reaction: null };
  }

  public async reportActivity(
    id: string,
    dto: CryptoActivityReportDto,
    viewer?: CryptoActivityViewer
  ) {
    const entity = await this.resolveActivityForInteraction(id, viewer);
    const reportData: any = {
      ...this.activityRelationFields(entity),
      reason: dto.reason || "report",
      message: dto.message || "",
    };
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (userObjectId) {
      return this.upsertActivityRelation(
        this.reportModel,
        userObjectId,
        entity,
        {
          reason: reportData.reason,
          message: reportData.message,
        }
      );
    }

    return this.reportModel.create(reportData);
  }

  public async addActivityToCalendar(
    id: string,
    viewer: CryptoActivityViewer,
    dto: CryptoActivityCalendarDto
  ) {
    const entity = await this.resolveActivityForInteraction(id, viewer);
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (!userObjectId) throw new BadRequestException("Invalid user");

    const activity = entity.activity;
    const rawDate = dto.date || activity.endDate || activity.startDate;
    const date = rawDate
      ? rawDate instanceof Date
        ? rawDate
        : new Date(rawDate)
      : undefined;

    const calendarItem = await this.upsertActivityRelation(
      this.calendarItemModel,
      userObjectId,
      entity,
      {
        date: date && !Number.isNaN(date.getTime()) ? date : undefined,
        note: dto.note || "",
      }
    );

    return calendarItem;
  }

  public async removeActivityFromCalendar(
    id: string,
    viewer: CryptoActivityViewer
  ) {
    const entity = await this.resolveActivityForInteraction(id, viewer);
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (!userObjectId) throw new BadRequestException("Invalid user");

    await this.calendarItemModel.deleteMany(
      this.activityRelationQuery(userObjectId, entity)
    );

    return { isAddedToCalendar: false };
  }

  public async updateStepProgress(
    id: string,
    viewer: CryptoActivityViewer,
    dto: CryptoActivityStepProgressDto
  ) {
    const entity = await this.resolveActivityForInteraction(id, viewer);
    const userObjectId = this.toObjectId(
      this.fomoV2CompatibilityService.viewerId(viewer)
    );
    if (!userObjectId) throw new BadRequestException("Invalid user");

    const rawActivity = entity.activity?.toObject
      ? entity.activity.toObject()
      : entity.activity;
    const normalizedActivity = this.withActivityStepIds(rawActivity);
    const validStepIds = new Set(
      this.activitySteps(normalizedActivity).map((step) => step.id)
    );
    if (!validStepIds.size) {
      throw new BadRequestException("Activity has no steps");
    }

    const existingRows = await this.stepProgressModel
      .find(this.activityRelationQuery(userObjectId, entity))
      .lean()
      .exec();
    let completedStepIds = existingRows
      .flatMap((row) =>
        Array.isArray(row.completedStepIds) ? row.completedStepIds : []
      )
      .map((stepId) => this.toNonEmptyString(stepId))
      .filter((stepId) => stepId && validStepIds.has(stepId));

    if (Array.isArray(dto.completedStepIds)) {
      completedStepIds = dto.completedStepIds
        .map((stepId) => this.toNonEmptyString(stepId))
        .filter((stepId) => stepId && validStepIds.has(stepId));
    } else {
      const stepId = this.toNonEmptyString(dto.stepId);
      if (!stepId || !validStepIds.has(stepId)) {
        throw new BadRequestException("Unknown step");
      }

      const nextIds = new Set(completedStepIds);
      if (dto.completed === false) nextIds.delete(stepId);
      else nextIds.add(stepId);
      completedStepIds = Array.from(nextIds);
    }

    completedStepIds = Array.from(new Set(completedStepIds));

    await this.upsertActivityRelation(
      this.stepProgressModel,
      userObjectId,
      entity,
      { completedStepIds }
    );

    return {
      activityId: String(entity.activityId),
      userState: this.activityStepUserState(
        normalizedActivity,
        completedStepIds
      ),
    };
  }

  private async requireBoardAccess(
    viewer: CryptoActivityViewer
  ): Promise<string> {
    const userId = this.fomoV2CompatibilityService.viewerId(viewer);
    if (!this.toObjectId(userId)) throw new BadRequestException("Invalid user");
    await this.fomoV2CompatibilityService.requireAccess("prime", viewer);
    return userId!;
  }

  private requireBoardViewer(viewer: CryptoActivityViewer): string {
    const userId = this.fomoV2CompatibilityService.viewerId(viewer);
    if (!this.toObjectId(userId)) throw new BadRequestException("Invalid user");
    return userId!;
  }

  private adminTaskObjectId(id: string): mongoose.Types.ObjectId | null {
    const value = String(id || "").trim();
    if (!value.startsWith(ADMIN_TASK_ID_PREFIX)) return null;
    return this.toObjectId(value.slice(ADMIN_TASK_ID_PREFIX.length));
  }

  private normalizeAdminTaskStatus(value?: string): EarlylandTaskUserStatus {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
    if (["completed", "complete", "done"].includes(normalized)) {
      return "completed";
    }
    if (["in-progress", "in progress", "active"].includes(normalized)) {
      return "in-progress";
    }
    return "todo";
  }

  private sharedTaskAccessTier(task: any, activity?: any): "public" | "prime" {
    return task?.accessTier === "prime" || activity?.accessTier === "prime"
      ? "prime"
      : "public";
  }

  private mapAdminTaskForUi(
    task: any,
    state: any,
    columns: CryptoActivityBoardColumnDocument[],
    activity: any,
    viewerAccess: any,
    canEditStatus = Boolean(viewerAccess?.allowed),
  ) {
    const status = this.normalizeAdminTaskStatus(state?.status || task.status);
    const statusColumn = this.boardColumnByStatus(columns, status);
    const activityId = String(task.v2ActivityId);
    const accessTier = this.sharedTaskAccessTier(task, activity);
    const isLocked = !viewerAccess?.allowed;
    const scheduledDate = this.toDateOnlyString(
      task.date || activity?.endDate || activity?.startDate
    );
    const taskTitle = this.toNonEmptyString(task.name) || "Earlyland task";
    const activityName = this.activityTitle(activity) || "Earlyland";

    return {
      id: `${ADMIN_TASK_ID_PREFIX}${String(task._id)}`,
      backendId: `${ADMIN_TASK_ID_PREFIX}${String(task._id)}`,
      adminTaskId: String(task._id),
      v2ActivityId: activityId,
      activityId,
      activityEntity: "fomo_v2",
      activityPath: `/crypto/earlyland/${activityId}`,
      columnId: statusColumn ? String(statusColumn._id) : undefined,
      title: taskTitle,
      projectName: taskTitle,
      projectPlatform: activityName,
      projectLogo: this.activityLogo(activity),
      category: this.normalizeBoardCategory(
        activity?.activityType || activity?.category
      ),
      difficulty: this.normalizeDifficultyValue(activity?.difficulty),
      status,
      scheduledDate,
      description: isLocked
        ? undefined
        : this.toNonEmptyString(task.description || task.smallDescription) ||
          undefined,
      notes: undefined,
      sourceUrl: isLocked
        ? undefined
        : this.toNonEmptyString(task.link) || this.activitySourceUrl(activity),
      tags: Array.isArray(activity?.tags) ? activity.tags : [],
      rewards: this.activityRewards(activity),
      requirements: this.activityRequirements(activity),
      points: Number(task.points || 0),
      accessTier,
      isPrime: accessTier === "prime",
      nftRequired: accessTier === "prime",
      viewerAccess,
      isLocked,
      isRedacted: isLocked,
      isGlobal: true,
      isSystem: true,
      origin: "admin",
      sourceType: "admin-task",
      canDelete: false,
      isDeletable: false,
      canEdit: canEditStatus,
      canEditStatus,
    };
  }

  private async getSharedAdminTasks(
    viewer?: CryptoActivityViewer,
    columns: CryptoActivityBoardColumnDocument[] = [],
    range?: { start: Date; end: Date },
  ): Promise<any[]> {
    const taskFilter: Record<string, any> = {
      type: "default",
      v2ActivityId: { $exists: true, $ne: null },
    };
    if (range) {
      taskFilter.$or = [
        { date: { $gte: range.start, $lt: range.end } },
        { date: null },
        { date: { $exists: false } },
      ];
    }
    const tasks = await this.taskModel
      .find(taskFilter)
      .sort({ date: 1, createdAt: 1 })
      .lean();
    if (!tasks.length) return [];

    const activityResolution = await this.getActivitiesMap(
      tasks.map((task) => task.v2ActivityId).filter(Boolean),
      viewer,
      { includeRedacted: true }
    );
    const userId = this.fomoV2CompatibilityService.viewerId(viewer);
    const userObjectId = this.toObjectId(userId);
    const taskIds = tasks.map((task) => task._id);
    const states = userObjectId
      ? await this.taskUserStateModel
          .find({ userId: userObjectId, taskId: { $in: taskIds } })
          .lean()
      : [];
    const stateByTaskId = new Map(
      states.map((state) => [String(state.taskId), state])
    );
    const accessByTier = new Map<string, any>();
    const mapped: any[] = [];

    for (const task of tasks) {
      const activity = activityResolution.activities.get(
        String(task.v2ActivityId)
      );
      if (!activity) continue;
      const accessTier = this.sharedTaskAccessTier(task, activity);
      let viewerAccess = accessByTier.get(accessTier);
      if (!viewerAccess) {
        viewerAccess = await this.fomoV2CompatibilityService.resolveAccess(
          accessTier,
          viewer
        );
        accessByTier.set(accessTier, viewerAccess);
      }
      mapped.push(
        this.mapAdminTaskForUi(
          task,
          stateByTaskId.get(String(task._id)),
          columns,
          activity,
          viewerAccess,
          Boolean(userObjectId && viewerAccess?.allowed),
        )
      );
    }

    return mapped;
  }

  private async ensureBoardColumns(
    userId: string
  ): Promise<CryptoActivityBoardColumnDocument[]> {
    const userObjectId = this.toObjectId(userId);
    if (!userObjectId) throw new BadRequestException("Invalid user");

    let columns = await this.boardColumnModel
      .find({ userId: userObjectId })
      .sort({ order: 1, createdAt: 1 })
      .exec();

    const existingStatuses = new Set(
      columns
        .map((column) => this.explicitBoardStatus(column.title))
        .filter(Boolean)
    );
    const missingDefaults = BOARD_STATUS_COLUMNS.filter(
      (column) => !existingStatuses.has(column.id)
    );
    if (!missingDefaults.length) return columns;

    const nextOrder =
      columns.reduce(
        (max, column) => Math.max(max, Number(column.order || 0)),
        -1
      ) + 1;
    await this.boardColumnModel.insertMany(
      missingDefaults.map((column, index) => ({
        userId: userObjectId,
        title: column.title,
        order: nextOrder + index,
      }))
    );

    columns = await this.boardColumnModel
      .find({ userId: userObjectId })
      .sort({ order: 1, createdAt: 1 })
      .exec();

    return columns;
  }

  private async getActivitiesMap(
    activityIds: Array<any>,
    viewer?: CryptoActivityViewer,
    options: { includeRedacted?: boolean } = {}
  ): Promise<{
    activities: Map<string, any>;
    blockedIds: Set<string>;
  }> {
    const objectIds = activityIds
      .map((id) => this.toObjectId(String(id)))
      .filter(Boolean);

    if (!objectIds.length) {
      return { activities: new Map(), blockedIds: new Set() };
    }

    const v2Resolution = await this.fomoV2CompatibilityService.resolveObjectIds(
      objectIds,
      viewer,
      options
    );
    const unresolvedIds = objectIds.filter(
      (id) => !v2Resolution.knownV2Ids.has(String(id))
    );
    const legacyActivities =
      unresolvedIds.length && this.legacyPublicFallbackEnabled()
        ? await this.activityModel.find({ _id: { $in: unresolvedIds } }).lean()
        : [];
    const activities = new Map(v2Resolution.activities);
    const blockedIds = new Set(v2Resolution.blockedIds);
    const accessByTier = new Map<string, any>();

    for (const activity of legacyActivities) {
      const accessTier = activity.nftRequired ? "prime" : "public";
      let viewerAccess = accessByTier.get(accessTier);
      if (!viewerAccess) {
        viewerAccess = await this.fomoV2CompatibilityService.resolveAccess(
          accessTier,
          viewer
        );
        accessByTier.set(accessTier, viewerAccess);
      }
      if (!viewerAccess.allowed) {
        blockedIds.add(String(activity._id));
        continue;
      }
      activities.set(String(activity._id), {
        ...activity,
        activityEntity: "legacy",
        viewerAccess,
      });
    }

    return { activities, blockedIds };
  }

  private mapCustomBoard(board: any) {
    return {
      id: String(board._id),
      label: board.title,
      icon: "folder" as BoardIcon,
      count: 0,
    };
  }

  private mapBoardTaskForUi(
    task: any,
    columns: CryptoActivityBoardColumnDocument[],
    activity?: any
  ) {
    const column = columns.find(
      (item) => String(item._id) === String(task.columnId)
    );
    const status = this.normalizeBoardStatus(task.status || column?.title);
    const scheduledDate = this.toDateOnlyString(task.dueDate);
    const dueDate = this.parseDateOnly(task.dueDate);
    const today = new Date();
    const todayStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const diffDays = dueDate
      ? Math.ceil(
          (dueDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000)
        )
      : undefined;
    const activityName = activity ? this.activityTitle(activity) : "";
    const title =
      this.toNonEmptyString(task.title) || activityName || "Untitled task";
    const projectName =
      this.toNonEmptyString(task.projectName) || activityName || title;
    const projectPlatform =
      this.toNonEmptyString(task.projectPlatform) ||
      this.toNonEmptyString(activity?.coinSymbol) ||
      this.toNonEmptyString(activity?.symbol) ||
      projectName;
    const category = this.normalizeBoardCategory(
      task.category || activity?.activityType || activity?.category
    );

    return {
      ...task,
      id: String(task._id),
      backendId: String(task._id),
      activityId: task.activityId ? String(task.activityId) : undefined,
      v2ActivityId: task.v2ActivityId ? String(task.v2ActivityId) : undefined,
      activityEntity:
        task.activityEntity || (task.v2ActivityId ? "fomo_v2" : "legacy"),
      columnId: task.columnId ? String(task.columnId) : undefined,
      boardId: task.boardId ? String(task.boardId) : undefined,
      title,
      projectName: title,
      projectPlatform,
      projectLogo:
        this.toNonEmptyString(task.projectLogo) || this.activityLogo(activity),
      category,
      difficulty: this.normalizeDifficultyValue(
        task.difficulty || activity?.difficulty
      ),
      status,
      scheduledDate,
      description:
        this.toNonEmptyString(task.description) ||
        this.activityDescription(activity),
      notes: this.toNonEmptyString(task.notes) || undefined,
      sourceUrl:
        this.toNonEmptyString(task.sourceUrl) ||
        this.activitySourceUrl(activity),
      tags:
        Array.isArray(task.tags) && task.tags.length
          ? task.tags
          : Array.isArray(activity?.tags)
          ? activity.tags
          : [],
      rewards:
        Array.isArray(task.rewards) && task.rewards.length
          ? task.rewards
          : this.activityRewards(activity),
      requirements:
        Array.isArray(task.requirements) && task.requirements.length
          ? task.requirements
          : this.activityRequirements(activity),
      isExpired: Boolean(
        diffDays !== undefined && diffDays < 0 && status !== "completed"
      ),
      daysLeft:
        diffDays !== undefined && diffDays >= 0 && status !== "completed"
          ? diffDays
          : undefined,
    };
  }

  private matchesBoardTask(
    task: any,
    query: CryptoActivityBoardQueryDto = {}
  ): boolean {
    const boardId = String(query.boardId || "all");
    if (boardId && boardId !== "all") {
      const isDefaultBoard = DEFAULT_BOARD_ITEMS.some(
        (item) => item.id === boardId
      );
      if (isDefaultBoard) {
        if (task.category !== boardId) return false;
      } else if (String(task.boardId || "") !== boardId) {
        return false;
      }
    }

    const statuses = this.splitQueryValue(query.status).map((status) =>
      this.normalizeBoardStatus(status)
    );
    if (statuses.length && !statuses.includes(task.status)) return false;

    const types = this.splitQueryValue(query.type).map((type) =>
      this.normalizeBoardCategory(type)
    );
    if (types.length && !types.includes(task.category)) return false;

    const search = String(query.search || "")
      .trim()
      .toLowerCase();
    if (search) {
      const haystack = [
        task.title,
        task.projectName,
        task.projectPlatform,
        task.description,
        task.notes,
        task.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    return true;
  }

  private boardStats(tasks: any[]) {
    const totalTasks = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === "in-progress"
    ).length;

    return {
      totalTasks,
      inProgress,
      completed,
      xpEarned: completed * 25,
      overallProgress: totalTasks
        ? Math.round((completed / totalTasks) * 100)
        : 0,
    };
  }

  private boardItems(tasks: any[], customBoards: any[]) {
    const defaultBoards = DEFAULT_BOARD_ITEMS.map((board) => ({
      ...board,
      count:
        board.id === "all"
          ? tasks.length
          : tasks.filter((task) => task.category === board.id).length,
    }));

    const customItems = customBoards.map((board) => ({
      ...this.mapCustomBoard(board),
      count: tasks.filter(
        (task) => String(task.boardId || "") === String(board._id)
      ).length,
    }));

    return [...defaultBoards, ...customItems];
  }

  public async getBoard(
    viewer: CryptoActivityViewer,
    query: CryptoActivityBoardQueryDto = {}
  ) {
    const userId = this.requireBoardViewer(viewer);
    const columns = await this.ensureBoardColumns(userId);
    const userObjectId = this.toObjectId(userId);
    const columnIds = columns.map((column) => column._id);
    const boardAccess = await this.fomoV2CompatibilityService.resolveAccess(
      "prime",
      viewer
    );
    const [tasks, customBoards, sharedTasks] = await Promise.all([
      boardAccess.allowed
        ? this.boardTaskModel
            .find({ userId: userObjectId, columnId: { $in: columnIds } })
            .sort({ order: 1, createdAt: 1 })
            .lean()
        : Promise.resolve([]),
      boardAccess.allowed
        ? this.boardModel
            .find({ userId: userObjectId })
            .sort({ order: 1, createdAt: 1 })
            .lean()
        : Promise.resolve([]),
      this.getSharedAdminTasks(viewer, columns),
    ]);
    const activityResolution = await this.getActivitiesMap(
      tasks.map((task) => task.v2ActivityId || task.activityId).filter(Boolean),
      viewer
    );
    const personalTasks = tasks
      .filter((task) => {
        const relationId = this.fomoV2CompatibilityService.relationId(task);
        return !relationId || activityResolution.activities.has(relationId);
      })
      .map((task) => {
        const relationId = this.fomoV2CompatibilityService.relationId(task);
        return this.mapBoardTaskForUi(
          task,
          columns,
          relationId ? activityResolution.activities.get(relationId) : undefined
        );
      });
    const mappedTasks = [...sharedTasks, ...personalTasks];
    const filteredTasks = mappedTasks.filter((task) =>
      this.matchesBoardTask(task, query)
    );

    const tasksByColumn = new Map<string, any[]>();
    for (const task of filteredTasks) {
      const key = String(task.columnId || "");
      tasksByColumn.set(key, [...(tasksByColumn.get(key) || []), task]);
    }

    return {
      boards: this.boardItems(mappedTasks, customBoards),
      stats: this.boardStats(filteredTasks),
      permissions: {
        canManagePersonalBoard: Boolean(boardAccess.allowed),
      },
      columns: columns.map((column) => {
        const statusId = this.explicitBoardStatus(column.title);
        const statusColumn = statusId
          ? BOARD_STATUS_COLUMNS.find((item) => item.id === statusId)
          : undefined;
        const backendId = String(column._id);

        return {
          id: statusColumn?.id || backendId,
          backendId,
          label: column.title,
          dotColor: statusColumn?.dotColor || "#89909e",
          tasks: tasksByColumn.get(backendId) || [],
        };
      }),
    };
  }

  public async createBoard(
    viewer: CryptoActivityViewer,
    dto: CryptoActivityBoardDto
  ) {
    const userId = await this.requireBoardAccess(viewer);
    const userObjectId = this.toObjectId(userId);
    if (!userObjectId) throw new BadRequestException("Invalid user");

    const title = this.toNonEmptyString(dto.title);
    if (!title) throw new BadRequestException("Board title is required");

    const order =
      dto.order !== undefined
        ? Number(dto.order)
        : await this.boardModel.countDocuments({ userId: userObjectId });

    const board = await this.boardModel.create({
      userId: userObjectId,
      title,
      icon: dto.icon || "folder",
      order: Number.isFinite(order) ? order : 0,
    });

    return this.mapCustomBoard(board.toObject());
  }

  public async createBoardColumn(
    viewer: CryptoActivityViewer,
    dto: CryptoActivityBoardColumnDto
  ) {
    const userId = await this.requireBoardAccess(viewer);
    const userObjectId = this.toObjectId(userId);
    if (!userObjectId) throw new BadRequestException("Invalid user");

    const order =
      dto.order !== undefined
        ? Number(dto.order)
        : await this.boardColumnModel.countDocuments({ userId: userObjectId });

    return this.boardColumnModel.create({
      userId: userObjectId,
      title: dto.title || "New column",
      order: Number.isFinite(order) ? order : 0,
    });
  }

  public async updateBoardColumn(
    viewer: CryptoActivityViewer,
    id: string,
    dto: CryptoActivityBoardColumnDto
  ) {
    const userId = await this.requireBoardAccess(viewer);
    const userObjectId = this.toObjectId(userId);
    const columnObjectId = this.toObjectId(id);
    if (!userObjectId || !columnObjectId)
      throw new BadRequestException("Invalid column");

    const update: any = {};
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.order !== undefined) update.order = Number(dto.order);

    const column = await this.boardColumnModel.findOneAndUpdate(
      { _id: columnObjectId, userId: userObjectId },
      update,
      { new: true }
    );
    if (!column) throw new NotFoundException("Board column not found");

    return column;
  }

  public async deleteBoardColumn(viewer: CryptoActivityViewer, id: string) {
    const userId = await this.requireBoardAccess(viewer);
    const userObjectId = this.toObjectId(userId);
    const columnObjectId = this.toObjectId(id);
    if (!userObjectId || !columnObjectId)
      throw new BadRequestException("Invalid column");

    const column = await this.boardColumnModel.findOneAndDelete({
      _id: columnObjectId,
      userId: userObjectId,
    });
    if (!column) throw new NotFoundException("Board column not found");

    await this.boardTaskModel.deleteMany({
      userId: userObjectId,
      columnId: columnObjectId,
    });

    return { success: true };
  }

  public async createBoardTask(
    viewer: CryptoActivityViewer,
    dto: CryptoActivityBoardTaskDto
  ) {
    const userId = await this.requireBoardAccess(viewer);
    const columns = await this.ensureBoardColumns(userId);
    const userObjectId = this.toObjectId(userId);
    const status = this.normalizeBoardStatus(dto.status);
    const statusColumn = this.boardColumnByStatus(columns, status);
    const columnObjectId =
      this.toObjectId(dto.columnId) || statusColumn?._id || columns[0]?._id;

    if (!userObjectId || !columnObjectId)
      throw new BadRequestException("Invalid task");

    const column = await this.boardColumnModel.findOne({
      _id: columnObjectId,
      userId: userObjectId,
    });
    if (!column) throw new NotFoundException("Board column not found");
    const taskStatus =
      dto.status !== undefined
        ? status
        : this.normalizeBoardStatus(column.title);

    const activityEntity = dto.activityId
      ? await this.resolveActivityForInteraction(dto.activityId, viewer)
      : null;
    const activity = activityEntity?.activity || null;
    const dueDate = this.parseDateOnly(dto.dueDate || dto.scheduledDate);
    const boardObjectId = this.toObjectId(dto.boardId);
    if (dto.boardId && !boardObjectId)
      throw new BadRequestException("Invalid board");
    if (boardObjectId) {
      const board = await this.boardModel.findOne({
        _id: boardObjectId,
        userId: userObjectId,
      });
      if (!board) throw new NotFoundException("Board not found");
    }
    const order =
      dto.order !== undefined
        ? Number(dto.order)
        : await this.boardTaskModel.countDocuments({
            userId: userObjectId,
            columnId: columnObjectId,
          });

    const created = await this.boardTaskModel.create({
      userId: userObjectId,
      ...(activityEntity ? this.activityRelationFields(activityEntity) : {}),
      columnId: columnObjectId,
      boardId: boardObjectId || undefined,
      title:
        this.toNonEmptyString(dto.title) ||
        (activity ? this.activityTitle(activity) : "Untitled task"),
      projectName:
        this.toNonEmptyString(dto.projectName) ||
        (activity ? this.activityTitle(activity) : ""),
      projectPlatform:
        this.toNonEmptyString(dto.projectPlatform) ||
        this.toNonEmptyString(activity?.coinSymbol) ||
        this.toNonEmptyString(activity?.symbol) ||
        (activity ? this.activityTitle(activity) : ""),
      projectLogo:
        this.toNonEmptyString(dto.projectLogo) || this.activityLogo(activity),
      description:
        this.toNonEmptyString(dto.description) ||
        this.activityDescription(activity),
      category: this.normalizeBoardCategory(
        dto.category || activity?.activityType || activity?.category
      ),
      difficulty: this.normalizeDifficultyValue(
        dto.difficulty || activity?.difficulty
      ),
      notes: dto.notes || "",
      sourceUrl:
        this.toNonEmptyString(dto.sourceUrl) ||
        this.activitySourceUrl(activity),
      tags:
        Array.isArray(dto.tags) && dto.tags.length
          ? dto.tags
          : Array.isArray(activity?.tags)
          ? activity.tags
          : [],
      rewards:
        Array.isArray(dto.rewards) && dto.rewards.length
          ? dto.rewards
          : this.activityRewards(activity),
      requirements:
        Array.isArray(dto.requirements) && dto.requirements.length
          ? dto.requirements
          : this.activityRequirements(activity),
      dueDate: dueDate || undefined,
      status: taskStatus,
      order: Number.isFinite(order) ? order : 0,
    });

    return this.mapBoardTaskForUi(created.toObject(), columns, activity);
  }

  // ── G7: Add a FOMO Task (Team Task) to the personal board as a REFERENCE ──
  // Creates a reference-card (sourceType=FOMO_TASK, sourceTaskId), never a
  // clone. XP / criteria / verification / reward remain owned by the canonical
  // Task; the user only owns column / note / priority / position. Prime access
  // is enforced by the backend access engine — no bypass.
  public async addFomoTaskToBoard(
    viewer: CryptoActivityViewer,
    taskId: string,
  ) {
    const userId = await this.requireBoardAccess(viewer);
    const userObjectId = this.toObjectId(userId)!;
    const taskObjectId = this.toObjectId(taskId);
    if (!taskObjectId) throw new BadRequestException("Invalid task");

    const task = await this.taskModel.findOne({
      _id: taskObjectId,
      type: "default",
      v2ActivityId: { $exists: true, $ne: null },
    });
    if (!task) throw new NotFoundException("FOMO task not found");

    const activityResolution = await this.getActivitiesMap(
      [task.v2ActivityId],
      viewer,
      { includeRedacted: true }
    );
    const activity = activityResolution.activities.get(
      String(task.v2ActivityId)
    );
    if (!activity) throw new NotFoundException("Linked activity is not public");

    // G11: never bypass Prime access policy — backend refuses if not allowed.
    const accessTier = this.sharedTaskAccessTier(task, activity);
    await this.fomoV2CompatibilityService.requireAccess(accessTier, viewer);

    const columns = await this.ensureBoardColumns(userId);

    // Idempotent: return the existing reference card if already on the board.
    const existing = await this.boardTaskModel.findOne({
      userId: userObjectId,
      sourceType: "FOMO_TASK",
      sourceTaskId: taskObjectId,
    });
    if (existing) {
      return this.mapBoardTaskForUi(existing.toObject(), columns, activity);
    }

    const targetColumn =
      this.boardColumnByStatus(columns, this.normalizeBoardStatus("to do")) ||
      columns[0];
    const columnObjectId = targetColumn?._id;
    if (!columnObjectId) throw new NotFoundException("Board column not found");

    const order = await this.boardTaskModel.countDocuments({
      userId: userObjectId,
      columnId: columnObjectId,
    });

    const created = await this.boardTaskModel.create({
      userId: userObjectId,
      v2ActivityId: task.v2ActivityId,
      activityEntity: "fomo_v2",
      columnId: columnObjectId,
      title:
        this.toNonEmptyString(task.name) ||
        (activity ? this.activityTitle(activity) : "FOMO Task"),
      projectName: activity ? this.activityTitle(activity) : "",
      projectLogo: this.activityLogo(activity),
      description:
        this.toNonEmptyString(task.smallDescription) ||
        this.toNonEmptyString(task.description) ||
        "",
      difficulty: this.normalizeDifficultyValue(task.difficulty),
      dueDate: task.deadline || undefined,
      status: this.normalizeBoardStatus(targetColumn.title),
      order: Number.isFinite(order) ? order : 0,
      sourceType: "FOMO_TASK",
      sourceTaskId: taskObjectId,
      rewards: [{ type: "xp", value: Number(task.points || 0) }],
    });

    return this.mapBoardTaskForUi(created.toObject(), columns, activity);
  }

  private async updateSharedAdminTaskState(
    viewer: CryptoActivityViewer,
    taskObjectId: mongoose.Types.ObjectId,
    dto: CryptoActivityBoardTaskDto
  ) {
    const userId = this.requireBoardViewer(viewer);
    const userObjectId = this.toObjectId(userId)!;
    const task = await this.taskModel.findOne({
      _id: taskObjectId,
      type: "default",
      v2ActivityId: { $exists: true, $ne: null },
    });
    if (!task) throw new NotFoundException("Shared Earlyland task not found");

    const activityResolution = await this.getActivitiesMap(
      [task.v2ActivityId],
      viewer,
      { includeRedacted: true }
    );
    const activity = activityResolution.activities.get(
      String(task.v2ActivityId)
    );
    if (!activity) throw new NotFoundException("Linked activity is not public");
    const accessTier = this.sharedTaskAccessTier(task, activity);
    await this.fomoV2CompatibilityService.requireAccess(accessTier, viewer);

    const columns = await this.ensureBoardColumns(userId);
    let status = this.normalizeAdminTaskStatus(dto.status || task.status);
    if (dto.columnId !== undefined) {
      const columnObjectId = this.toObjectId(dto.columnId);
      if (!columnObjectId) throw new BadRequestException("Invalid column");
      const column = await this.boardColumnModel.findOne({
        _id: columnObjectId,
        userId: userObjectId,
      });
      if (!column) throw new NotFoundException("Board column not found");
      status = this.normalizeAdminTaskStatus(column.title);
    }

    const state = await this.taskUserStateModel.findOneAndUpdate(
      { taskId: task._id, userId: userObjectId },
      { $set: { status } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (status === "completed") {
      // Mark claimed (guarded) and award XP exclusively through the ledger.
      await this.userModel.updateOne(
        {
          _id: userObjectId,
          "claimedTasks.taskId": { $ne: task._id },
        },
        {
          $push: { claimedTasks: { taskId: task._id, date: new Date() } },
        },
      );
      await this.xpLedger.award({
        userId: userObjectId.toString(),
        eventType: "earlyland_task",
        source: "system",
        sourceType: "task",
        sourceId: task._id.toString(),
        baseXpOverride: Math.max(0, Number(task.points || 0)),
        verified: true,
        reason: "Задание EarlyLand подтверждено",
      });
    }

    return this.mapAdminTaskForUi(
      task.toObject(),
      state?.toObject ? state.toObject() : state,
      columns,
      activity,
      { allowed: true, contentRedacted: false },
      true,
    );
  }

  public async updateBoardTask(
    viewer: CryptoActivityViewer,
    id: string,
    dto: CryptoActivityBoardTaskDto
  ) {
    const sharedTaskId = this.adminTaskObjectId(id);
    if (sharedTaskId) {
      return this.updateSharedAdminTaskState(viewer, sharedTaskId, dto);
    }

    const userId = await this.requireBoardAccess(viewer);
    const userObjectId = this.toObjectId(userId);
    const taskObjectId = this.toObjectId(id);
    if (!userObjectId || !taskObjectId)
      throw new BadRequestException("Invalid task");

    const columns = await this.ensureBoardColumns(userId);
    const existingTask = await this.boardTaskModel
      .findOne({ _id: taskObjectId, userId: userObjectId })
      .lean();
    if (!existingTask) throw new NotFoundException("Board task not found");
    const existingRelationId =
      this.fomoV2CompatibilityService.relationId(existingTask);
    let existingActivityEntity: ResolvedActivityEntity | null = null;
    if (existingRelationId) {
      existingActivityEntity = await this.resolveActivityForInteraction(
        existingRelationId,
        viewer
      );
    }
    const update: any = {};
    if (existingActivityEntity) {
      Object.assign(
        update,
        this.activityRelationFields(existingActivityEntity)
      );
    }
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.projectName !== undefined) update.projectName = dto.projectName;
    if (dto.projectPlatform !== undefined)
      update.projectPlatform = dto.projectPlatform;
    if (dto.projectLogo !== undefined) update.projectLogo = dto.projectLogo;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.category !== undefined)
      update.category = this.normalizeBoardCategory(dto.category);
    if (dto.difficulty !== undefined)
      update.difficulty = this.normalizeDifficultyValue(dto.difficulty);
    if (dto.notes !== undefined) update.notes = dto.notes;
    if (dto.sourceUrl !== undefined) update.sourceUrl = dto.sourceUrl;
    if (dto.tags !== undefined)
      update.tags = Array.isArray(dto.tags) ? dto.tags : [];
    if (dto.rewards !== undefined)
      update.rewards = Array.isArray(dto.rewards) ? dto.rewards : [];
    if (dto.requirements !== undefined)
      update.requirements = Array.isArray(dto.requirements)
        ? dto.requirements
        : [];
    if (dto.status !== undefined) {
      const status = this.normalizeBoardStatus(dto.status);
      update.status = status;
      if (dto.columnId === undefined) {
        const statusColumn = this.boardColumnByStatus(columns, status);
        if (statusColumn) update.columnId = statusColumn._id;
      }
    }
    if (dto.order !== undefined) update.order = Number(dto.order);
    if (dto.dueDate !== undefined || dto.scheduledDate !== undefined) {
      const dueDate = this.parseDateOnly(dto.dueDate || dto.scheduledDate);
      update.dueDate = dueDate || null;
    }
    if (dto.columnId !== undefined) {
      const columnObjectId = this.toObjectId(dto.columnId);
      if (!columnObjectId) throw new BadRequestException("Invalid column");
      const column = await this.boardColumnModel.findOne({
        _id: columnObjectId,
        userId: userObjectId,
      });
      if (!column) throw new NotFoundException("Board column not found");
      update.columnId = columnObjectId;
      update.status = this.normalizeBoardStatus(column.title);
    }
    if (dto.boardId !== undefined) {
      const boardObjectId = this.toObjectId(dto.boardId);
      if (dto.boardId && !boardObjectId)
        throw new BadRequestException("Invalid board");
      if (boardObjectId) {
        const board = await this.boardModel.findOne({
          _id: boardObjectId,
          userId: userObjectId,
        });
        if (!board) throw new NotFoundException("Board not found");
      }
      update.boardId = boardObjectId || null;
    }
    if (dto.activityId !== undefined) {
      const activityEntity = dto.activityId
        ? await this.resolveActivityForInteraction(dto.activityId, viewer)
        : null;
      if (activityEntity) {
        Object.assign(update, this.activityRelationFields(activityEntity));
      } else {
        update.activityId = null;
        update.v2ActivityId = null;
        update.activityEntity = "legacy";
      }
    }

    const task = await this.boardTaskModel.findOneAndUpdate(
      { _id: taskObjectId, userId: userObjectId },
      update,
      { new: true }
    );
    if (!task) throw new NotFoundException("Board task not found");

    const activityResolution = await this.getActivitiesMap(
      [task.v2ActivityId || task.activityId].filter(Boolean),
      viewer
    );
    const relationId = this.fomoV2CompatibilityService.relationId(task);
    return this.mapBoardTaskForUi(
      task.toObject(),
      columns,
      relationId ? activityResolution.activities.get(relationId) : undefined
    );
  }

  public async deleteBoardTask(viewer: CryptoActivityViewer, id: string) {
    if (this.adminTaskObjectId(id)) {
      throw new BadRequestException("Shared Earlyland tasks cannot be deleted");
    }
    const userId = await this.requireBoardAccess(viewer);
    const userObjectId = this.toObjectId(userId);
    const taskObjectId = this.toObjectId(id);
    if (!userObjectId || !taskObjectId)
      throw new BadRequestException("Invalid task");

    const task = await this.boardTaskModel.findOneAndDelete({
      _id: taskObjectId,
      userId: userObjectId,
    });
    if (!task) throw new NotFoundException("Board task not found");

    return { success: true };
  }

  private mapActivityToCalendarItem(
    activity: any,
    date: any,
    sourceType = "activity"
  ) {
    const title = this.activityTitle(activity);
    const activityId = String(activity._id);
    const sourceUrl = activity?.v2ActivityId
      ? this.toNonEmptyString(activity.sourceUrl) || undefined
      : this.activitySourceUrl(activity) || undefined;

    return {
      id:
        sourceType === "activity" ? activityId : `${sourceType}-${activityId}`,
      activityId,
      title,
      description: this.activityDescription(activity),
      descriptionHtml: this.activityDescriptionHtml(activity),
      type: this.normalizeActivityTypeValue(
        activity.activityType || activity.category
      ),
      status: this.toNonEmptyString(activity.status),
      lifecycleStatus: this.toNonEmptyString(
        activity.lifecycleStatus || activity.status
      ),
      publicationStatus: this.toNonEmptyString(activity.publicationStatus),
      accessTier: this.toNonEmptyString(
        activity.accessTier || (activity.nftRequired ? "prime" : "public")
      ),
      nftRequired: Boolean(
        activity.nftRequired || activity.accessTier === "prime"
      ),
      viewerAccess: activity.viewerAccess,
      isRedacted: Boolean(activity.isRedacted),
      project: {
        id: String(activity._id),
        name: title,
        symbol: this.toNonEmptyString(activity.coinSymbol || activity.symbol),
        logo: this.activityLogo(activity),
      },
      date: this.toDateOnlyString(date),
      startDate: this.toDateOnlyString(activity.startDate),
      endDate: this.toDateOnlyString(activity.endDate),
      sourceUrl,
      source: this.toNonEmptyString(
        activity.source || activity.primarySource || "crypto-activities"
      ),
      priority: this.toNonEmptyString(activity.difficulty),
      tags: Array.isArray(activity.tags) ? activity.tags : [],
      rewards: this.activityRewards(activity),
      requirements: this.activityRequirements(activity),
      originalUrl: this.toNonEmptyString(activity.originalUrl),
      links: activity.links,
      socialLinks: activity.socialLinks,
      taskGuide: activity.taskGuide,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      sourceType,
    };
  }

  private mapBoardTaskToCalendarItem(task: any) {
    const sourceType =
      task.sourceType === "admin-task" ? "admin-task" : "board-task";
    return {
      id: `${sourceType}-${task.id}`,
      boardTaskId: task.id,
      adminTaskId: task.adminTaskId,
      title: task.title,
      description: task.description,
      type: task.category,
      status: task.status,
      project: {
        id: task.activityId || task.id,
        name: task.projectName,
        symbol: task.projectPlatform,
        logo: task.projectLogo,
      },
      date: task.scheduledDate,
      startDate: task.scheduledDate,
      endDate: task.scheduledDate,
      sourceUrl: task.sourceUrl,
      source: sourceType === "admin-task" ? "admin" : "board",
      priority: task.difficulty,
      tags:
        Array.isArray(task.tags) && task.tags.length
          ? task.tags
          : [task.category].filter(Boolean),
      rewards: Array.isArray(task.rewards) ? task.rewards : [],
      requirements: Array.isArray(task.requirements) ? task.requirements : [],
      sourceType,
      accessTier: task.accessTier,
      nftRequired: task.nftRequired,
      viewerAccess: task.viewerAccess,
      isLocked: task.isLocked,
      isRedacted: task.isRedacted,
      isGlobal: task.isGlobal,
      isSystem: task.isSystem,
      canDelete: task.canDelete,
      canEdit: task.canEdit,
      activityPath: task.activityPath,
      boardTask: task,
    };
  }

  private matchesCalendarItem(
    item: any,
    query: CryptoActivityCalendarQueryDto
  ): boolean {
    const types = this.splitQueryValue(query.type).map((type) =>
      this.normalizeActivityTypeValue(type)
    );
    if (
      types.length &&
      !types.includes(this.normalizeActivityTypeValue(item.type))
    )
      return false;

    const statuses = this.splitQueryValue(query.status)
      .map((status) =>
        String(status || "")
          .replace(/[\s_-]/g, "")
          .toLowerCase()
      )
      .map((status) => {
        if (status === "live") return "active";
        if (status === "canceled") return "cancelled";
        return status;
      });
    const itemStatus = String(item.lifecycleStatus || item.status || "")
      .replace(/[\s_-]/g, "")
      .toLowerCase();
    if (statuses.length && !statuses.includes(itemStatus)) return false;

    const search = String(query.search || query.project || "")
      .trim()
      .toLowerCase();
    if (search) {
      const haystack = [
        item.title,
        item.description,
        item.type,
        item.status,
        item.project?.name,
        item.project?.symbol,
        ...(Array.isArray(item.tags) ? item.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    return true;
  }

  private calendarEventDate(
    activity: any,
    start: Date,
    end: Date
  ): Date | null {
    const activityStart = this.parseDateOnly(activity?.startDate);
    const activityEnd = this.parseDateOnly(activity?.endDate);
    if (activityEnd && this.isDateInRange(activityEnd, start, end))
      return activityEnd;
    if (activityStart && this.isDateInRange(activityStart, start, end))
      return activityStart;
    if (
      activityStart &&
      activityEnd &&
      activityStart.getTime() < start.getTime() &&
      activityEnd.getTime() >= start.getTime()
    ) {
      return start;
    }
    return null;
  }

  public async getCalendar(
    query: CryptoActivityCalendarQueryDto,
    viewer?: CryptoActivityViewer
  ) {
    const { start, end } = this.getCalendarRange(query);
    const limitValue = Number(query.limit || 500);
    const limit =
      Number.isFinite(limitValue) && limitValue > 0
        ? Math.min(Math.trunc(limitValue), 500)
        : 500;
    const offset = this.parseOffset(query.offset);
    const items: any[] = [];
    const activities =
      await this.fomoV2CompatibilityService.listCalendarActivities(
        start,
        end,
        viewer
      );
    for (const activity of activities) {
      const eventDate = this.calendarEventDate(activity, start, end);
      if (!eventDate) continue;
      const item = this.mapActivityToCalendarItem(activity, eventDate);
      if (!item.date || !this.matchesCalendarItem(item, query)) continue;
      items.push(item);
    }

    const sharedTasks = await this.getSharedAdminTasks(viewer, [], { start, end });
    for (const task of sharedTasks) {
      if (!task.scheduledDate) continue;
      if (!this.isDateInRange(task.scheduledDate, start, end)) continue;
      const item = this.mapBoardTaskToCalendarItem(task);
      if (!this.matchesCalendarItem(item, query)) continue;
      items.push(item);
    }

    const userId = this.fomoV2CompatibilityService.viewerId(viewer);
    const userObjectId = this.toObjectId(userId);
    if (userObjectId) {
      // Include saved items even when they have no stored `date` (e.g. the
      // activity has no start/end date yet). We resolve an effective date
      // below so "Add to calendar" always surfaces the saved activity.
      const calendarItems = await this.calendarItemModel
        .find({
          userId: userObjectId,
          $or: [
            { date: { $gte: start, $lt: end } },
            { date: { $exists: false } },
            { date: null },
          ],
        })
        .sort({ date: 1, createdAt: 1 })
        .lean();
      const calendarActivityResolution = await this.getActivitiesMap(
        calendarItems
          .map((item) => item.v2ActivityId || item.activityId)
          .filter(Boolean),
        viewer,
        { includeRedacted: true }
      );

      for (const calendarItem of calendarItems) {
        const relationId =
          this.fomoV2CompatibilityService.relationId(calendarItem);
        const activity = calendarActivityResolution.activities.get(relationId);
        if (!activity) continue;

        const effectiveDate =
          calendarItem.date ||
          (activity as any).endDate ||
          (activity as any).startDate ||
          (calendarItem as any).createdAt ||
          new Date();

        const item = {
          ...this.mapActivityToCalendarItem(
            activity,
            effectiveDate,
            "saved-activity"
          ),
          isSaved: true,
          note: calendarItem.note || "",
        };
        if (!item.date) continue;
        if (!this.matchesCalendarItem(item, query)) continue;
        items.push(item);
      }

      const boardAccess = await this.fomoV2CompatibilityService.resolveAccess(
        "prime",
        viewer
      );
      if (boardAccess.allowed) {
        const [columns, boardTasks] = await Promise.all([
          this.ensureBoardColumns(userId!),
          this.boardTaskModel
            .find({ userId: userObjectId, dueDate: { $gte: start, $lt: end } })
            .sort({ dueDate: 1, order: 1, createdAt: 1 })
            .lean(),
        ]);
        const taskActivityResolution = await this.getActivitiesMap(
          boardTasks
            .map((task) => task.v2ActivityId || task.activityId)
            .filter(Boolean),
          viewer
        );
        const mappedTasks = boardTasks
          .filter((task) => {
            const relationId = this.fomoV2CompatibilityService.relationId(task);
            return (
              !relationId || taskActivityResolution.activities.has(relationId)
            );
          })
          .map((task) => {
            const relationId = this.fomoV2CompatibilityService.relationId(task);
            return this.mapBoardTaskForUi(
              task,
              columns,
              relationId
                ? taskActivityResolution.activities.get(relationId)
                : undefined
            );
          });

        for (const task of mappedTasks) {
          const item = this.mapBoardTaskToCalendarItem(task);
          if (!item.date || !this.matchesCalendarItem(item, query)) continue;
          items.push(item);
        }
      }
    }

    const deduped = new Map<string, any>();
    for (const item of items) {
      const key =
        item.sourceType === "board-task" || item.sourceType === "admin-task"
          ? `${item.sourceType}:${item.boardTaskId}`
          : `activity:${item.activityId}:${item.date}`;
      const existing = deduped.get(key);
      if (!existing || item.sourceType === "saved-activity") {
        deduped.set(key, item);
      }
    }
    const sortedItems = Array.from(deduped.values());
    sortedItems.sort((a, b) => {
      const dateDiff = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateDiff !== 0) return dateDiff;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
    const total = sortedItems.length;
    const pageItems = sortedItems.slice(offset, offset + limit);

    return {
      items: pageItems,
      total,
      limit,
      offset,
      hasMore: offset + pageItems.length < total,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }
}
