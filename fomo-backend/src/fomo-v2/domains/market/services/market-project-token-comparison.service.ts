import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2MarketProjectReadModel } from "../models";

export type FomoV2MarketTokenComparisonMetric = "marketCap" | "fdv";

interface ResolvedMarketTokenComparisonProject {
  row: any;
  readModelId: string;
  marketAssetId: Types.ObjectId;
  canonicalProjectId?: string;
  coingeckoId?: string;
}

@Injectable()
export class FomoV2MarketProjectTokenComparisonService {
  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
  ) {}

  async getProjectTokenComparison(projectId: string, query: any = {}): Promise<any> {
    const project = await this.resolveProject(projectId);
    const metric = this.normalizeMetric(query?.metric || query?.sortBy || query?.chartValue);
    const limit = Math.min(this.positiveInteger(query?.limit, 5), 25);
    const categories = this.resolveComparisonCategories(project.row);
    const category = this.resolveSelectedCategory(query?.category || query?.currentValue, categories);
    const rows = await this.loadComparisonRows(project, metric, category, limit);

    return this.cleanObject({
      project: this.toProjectIdentity(project),
      metric,
      category,
      categories,
      rows,
      meta: {
        source: "fomo-v2-market-read-model",
        metric,
        category,
        limit,
        returnedRows: rows.length,
      },
    });
  }

  private async resolveProject(projectId: string): Promise<ResolvedMarketTokenComparisonProject> {
    const clauses = this.buildLookupClauses(projectId);
    if (!clauses.length) throw new NotFoundException("FOMO v2 market project not found.");

    const row = await this.readModel
      .findOne({
        trading: "CURRENTLY_TRADING",
        status: "active",
        $or: clauses,
      })
      .lean();

    if (!row?.marketAssetId) throw new NotFoundException("FOMO v2 market project not found.");

    return {
      row,
      readModelId: this.toIdString(row._id) || "",
      marketAssetId: new Types.ObjectId(this.toIdString(row.marketAssetId)),
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      coingeckoId: this.firstString(row.providerIds?.coingeckoId),
    };
  }

  private async loadComparisonRows(
    project: ResolvedMarketTokenComparisonProject,
    metric: FomoV2MarketTokenComparisonMetric,
    category: string | undefined,
    limit: number,
  ): Promise<any[]> {
    const metricField = this.metricField(metric);
    const baseValue = this.toFinitePositiveNumber(project.row?.[metricField]);
    const selectedRows = await this.loadSortedRowsWithBase(project, metricField, category, limit);

    return selectedRows.map((row) =>
      this.toComparisonRow(row, {
        metric,
        baseValue,
        isBase: this.isSameMarketAsset(row, project.row),
      }),
    );
  }

  private async loadSortedRowsWithBase(
    project: ResolvedMarketTokenComparisonProject,
    metricField: string,
    category: string | undefined,
    limit: number,
  ): Promise<any[]> {
    const filter = this.buildComparisonFilter(metricField, category);
    const topRows = await this.readModel
      .find(filter)
      .sort({ [metricField]: -1, rank: 1, _id: 1 })
      .limit(limit)
      .lean();

    if (topRows.some((row) => this.isSameMarketAsset(row, project.row))) {
      return topRows;
    }

    if (!this.matchesPrimaryCategory(project.row, category)) {
      return topRows;
    }

    const rowsWithBase = [...topRows.slice(0, Math.max(limit - 1, 0)), project.row];

    return rowsWithBase
      .sort((left, right) => {
        const leftValue = this.toFiniteNumber(left?.[metricField]) ?? 0;
        const rightValue = this.toFiniteNumber(right?.[metricField]) ?? 0;
        if (rightValue !== leftValue) return rightValue - leftValue;
        const leftRank = this.toFiniteNumber(left?.rank) ?? Number.MAX_SAFE_INTEGER;
        const rightRank = this.toFiniteNumber(right?.rank) ?? Number.MAX_SAFE_INTEGER;
        if (leftRank !== rightRank) return leftRank - rightRank;
        return String(left?._id || "").localeCompare(String(right?._id || ""));
      })
      .slice(0, limit);
  }

  private buildComparisonFilter(
    metricField: string,
    category: string | undefined,
  ): Record<string, any> {
    const filter: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
      rank: { $type: "number", $gt: 0 },
      "providerIds.coingeckoId": { $type: "string", $ne: "" },
      [metricField]: { $type: "number", $gt: 0 },
    };

    if (category) {
      const categoryRegex = new RegExp(`^${this.escapeRegExp(category)}$`, "i");
      filter.$or = [
        { category: categoryRegex },
        { niche: categoryRegex },
      ];
    }

    return filter;
  }

  private isSameMarketAsset(left: any, right: any): boolean {
    const leftMarketAssetId = this.toIdString(left?.marketAssetId);
    const rightMarketAssetId = this.toIdString(right?.marketAssetId);
    if (leftMarketAssetId && rightMarketAssetId && leftMarketAssetId === rightMarketAssetId) return true;

    const leftReadModelId = this.toIdString(left?._id);
    const rightReadModelId = this.toIdString(right?._id);
    return Boolean(leftReadModelId && rightReadModelId && leftReadModelId === rightReadModelId);
  }

  private matchesPrimaryCategory(row: any, category: string | undefined): boolean {
    if (!category) return true;
    const normalized = category.trim().toLowerCase();
    return [row?.category, row?.niche].some(
      (value) => typeof value === "string" && value.trim().toLowerCase() === normalized,
    );
  }

  private toComparisonRow(
    row: any,
    context: {
      metric: FomoV2MarketTokenComparisonMetric;
      baseValue?: number;
      isBase: boolean;
    },
  ): any {
    const coingeckoId = this.firstString(row.providerIds?.coingeckoId);
    const routeId =
      coingeckoId ||
      this.firstString(row.slug) ||
      this.toIdString(row.marketAssetId) ||
      this.toIdString(row._id);
    const symbol = this.firstString(row.symbol)?.toUpperCase();
    const marketCap = this.toFiniteNumber(row.marketCap) ?? this.toFiniteNumber(row.usdQuote?.market_cap);
    const fdv =
      this.toFiniteNumber(row.fullyDilutedMarketCap) ??
      this.toFiniteNumber(row.usdQuote?.fully_diluted_market_cap);
    const comparisonValue = context.metric === "fdv" ? fdv : marketCap;
    const secondaryValue = context.metric === "fdv" ? marketCap : fdv;
    const gainPotential =
      context.isBase || !context.baseValue || !comparisonValue
        ? null
        : comparisonValue / context.baseValue;

    return this.cleanObject({
      _id: routeId,
      id: routeId,
      capId: routeId,
      readModelId: this.toIdString(row._id),
      marketAssetId: this.toIdString(row.marketAssetId),
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      coingeckoId,
      projectType: "market",
      name: row.name,
      symbol,
      slug: routeId,
      logo: row.logo,
      niche: symbol || row.niche || row.name,
      rank: this.toFiniteNumber(row.rank),
      price: this.toFiniteNumber(row.price) ?? this.toFiniteNumber(row.usdQuote?.price),
      change24h:
        this.toFiniteNumber(row.priceChange) ??
        this.toFiniteNumber(row.performance?.usd?.change24h) ??
        this.toFiniteNumber(row.usdQuote?.percent_change_24h),
      change7d:
        this.toFiniteNumber(row.performance?.usd?.change7d) ??
        this.toFiniteNumber(row.usdQuote?.percent_change_7d),
      marketCap,
      fullyDilutedMarketCap: fdv,
      fdv,
      comparisonValue,
      secondaryValue,
      gainPotential,
      isBase: context.isBase,
    });
  }

  private toProjectIdentity(project: ResolvedMarketTokenComparisonProject): any {
    const row = project.row;
    const coingeckoId = project.coingeckoId;
    const routeId = coingeckoId || this.firstString(row.slug) || project.readModelId;

    return this.cleanObject({
      _id: routeId,
      id: routeId,
      readModelId: project.readModelId,
      marketAssetId: this.toIdString(project.marketAssetId),
      canonicalProjectId: project.canonicalProjectId,
      coingeckoId,
      projectType: "market",
      name: row.name,
      symbol: this.firstString(row.symbol)?.toUpperCase(),
      logo: row.logo,
      rank: this.toFiniteNumber(row.rank),
      tier: this.firstString(row.tier),
    });
  }

  private resolveComparisonCategories(row: any): string[] {
    const primaryCategory = this.firstString(row.category, row.niche);
    return this.uniqueStrings([
      primaryCategory,
      row.category,
      row.niche,
      ...(Array.isArray(row.topCategories) ? row.topCategories : []),
      ...(Array.isArray(row.categories) ? row.categories : []),
    ]);
  }

  private resolveSelectedCategory(value: any, categories: string[]): string | undefined {
    const requested = this.firstString(value);
    if (requested) {
      const existing = categories.find((category) => category.toLowerCase() === requested.toLowerCase());
      if (existing) return existing;
    }

    return categories[0];
  }

  private normalizeMetric(value: any): FomoV2MarketTokenComparisonMetric {
    const normalized = String(value || "marketCap").trim().toLowerCase();
    if (["fdv", "fullydilutedmarketcap", "fully_diluted_market_cap"].includes(normalized)) {
      return "fdv";
    }
    return "marketCap";
  }

  private metricField(metric: FomoV2MarketTokenComparisonMetric): "marketCap" | "fullyDilutedMarketCap" {
    return metric === "fdv" ? "fullyDilutedMarketCap" : "marketCap";
  }

  private buildLookupClauses(value: string): Record<string, any>[] {
    const normalized = this.normalizeLookupKey(value);
    const objectId = this.toObjectId(value);
    const clauses: Record<string, any>[] = [];

    if (normalized) {
      clauses.push(
        { "providerIds.coingeckoId": normalized },
        { slug: normalized },
      );
    }
    if (objectId) {
      clauses.push(
        { _id: objectId },
        { marketAssetId: objectId },
        { canonicalProjectId: objectId },
        { legacyProjectId: objectId },
      );
    }

    return clauses;
  }

  private normalizeLookupKey(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    const id = String(value || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    return String(value);
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    return undefined;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
  }

  private toFiniteNumber(value: any): number | undefined {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  private toFinitePositiveNumber(value: any): number | undefined {
    const numberValue = this.toFiniteNumber(value);
    return numberValue !== undefined && numberValue > 0 ? numberValue : undefined;
  }

  private uniqueStrings(values: any[]): string[] {
    const result: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(trimmed);
    }
    return result;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private cleanObject<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as Partial<T>;
  }
}
