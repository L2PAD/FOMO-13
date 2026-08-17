import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Funds } from "src/funds/funds.model";
import { Person } from "src/persons/person.model";

export type InvestorResolverEntityType = "fund" | "person" | "unknown" | "ambiguous";
export type InvestorResolverInputType = "fund" | "person" | "unknown";
export type InvestorResolverConfidence = "exact" | "high" | "medium" | "low" | "none";

export type InvestorResolverInput = {
  name?: string;
  slug?: string;
  type?: InvestorResolverInputType;
  source?: string;
  sourceId?: string | number;
  sourceKey?: string | number;
  sourceUrl?: string;
  dropstabId?: string | number;
  website?: string;
  twitter?: string;
  linkedin?: string;
};

export type InvestorResolverCandidate = {
  type: "fund" | "person";
  id: Types.ObjectId;
  name: string;
  slug?: string;
  score: number;
  matchedBy: string;
  reason: string;
};

export type InvestorResolutionResult = {
  type: InvestorResolverEntityType;
  fundId?: Types.ObjectId;
  personId?: Types.ObjectId;
  confidence: InvestorResolverConfidence;
  matchedBy: string;
  reason: string;
  candidates: InvestorResolverCandidate[];
};

type InvestorEntityDoc = {
  _id: Types.ObjectId;
  name?: string;
  normalizedName?: string;
  slug?: string;
  source?: string;
  sourceKey?: string;
  dropstabId?: number;
  aliases?: string[];
  website?: any;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
};

type InvestorMatchConfig = {
  confidence: InvestorResolverConfidence;
  matchedBy: string;
  reason: string;
  score: number;
};

@Injectable()
export class InvestorResolverService {
  constructor(
    @InjectModel(Funds.name) private readonly fundsModel: Model<Funds>,
    @InjectModel(Person.name) private readonly personModel: Model<Person>,
  ) {}

  async resolve(input: InvestorResolverInput): Promise<InvestorResolutionResult> {
    const normalized = this.normalizeInput(input);

    const exactResult = await this.resolveByExactSource(normalized);
    if (exactResult.confidence !== "none" || exactResult.type === "ambiguous") return exactResult;

    const slugResult = await this.resolveBySlug(normalized);
    if (slugResult.confidence !== "none" || slugResult.type === "ambiguous") return slugResult;

    const nameResult = await this.resolveByName(normalized);
    if (nameResult.confidence !== "none" || nameResult.type === "ambiguous") return nameResult;

    const aliasResult = await this.resolveByAliases(normalized);
    if (aliasResult.confidence !== "none" || aliasResult.type === "ambiguous") return aliasResult;

    const linkResult = await this.resolveByLinks(normalized);
    if (linkResult.confidence !== "none" || linkResult.type === "ambiguous") return linkResult;

    const fuzzyResult = await this.resolveByFuzzyName(normalized);
    if (fuzzyResult.confidence !== "none" || fuzzyResult.type === "ambiguous") return fuzzyResult;

    return this.unknown("No investor candidate matched by source id, slug, normalized name, aliases, website, or social links.");
  }

  async resolveMany(inputs: InvestorResolverInput[]): Promise<InvestorResolutionResult[]> {
    const results: InvestorResolutionResult[] = [];
    for (const input of inputs) {
      results.push(await this.resolve(input));
    }
    return results;
  }

  private async resolveByExactSource(input: NormalizedInvestorResolverInput): Promise<InvestorResolutionResult> {
    const ids = this.uniqueStrings([input.sourceId, input.sourceKey, input.dropstabId]);
    const source = input.source;
    const sourceUrls = this.uniqueStrings([input.sourceUrl, input.normalizedSourceUrl]);

    const fundOr: any[] = [];
    const personOr: any[] = [];

    if (input.numericDropstabId !== null) {
      fundOr.push({ dropstabId: input.numericDropstabId });
      personOr.push({ dropstabId: input.numericDropstabId });
    }

    if (ids.length) {
      if (source) {
        fundOr.push({ source, sourceKey: { $in: ids } });
        personOr.push({ source, sourceKey: { $in: ids } });
        fundOr.push({ sourceMappings: { $elemMatch: { source, sourceId: { $in: ids } } } });
        personOr.push({ sourceMappings: { $elemMatch: { source, sourceId: { $in: ids } } } });
      }
      fundOr.push({ sourceKey: { $in: ids } }, { "sourceMappings.sourceId": { $in: ids } });
      personOr.push({ sourceKey: { $in: ids } }, { "sourceMappings.sourceId": { $in: ids } });
    }

    if (sourceUrls.length) {
      if (source) {
        fundOr.push({ sourceMappings: { $elemMatch: { source, sourceUrl: { $in: sourceUrls } } } });
        personOr.push({ sourceMappings: { $elemMatch: { source, sourceUrl: { $in: sourceUrls } } } });
      }
      fundOr.push({ "sourceMappings.sourceUrl": { $in: sourceUrls } });
      personOr.push({ "sourceMappings.sourceUrl": { $in: sourceUrls } });
    }

    return this.resolveFromQueries(fundOr, personOr, input, {
      confidence: "exact",
      matchedBy: "source",
      reason: "Exact investor source mapping, source id, source URL, or Dropstab id match.",
      score: 100,
    });
  }

  private async resolveBySlug(input: NormalizedInvestorResolverInput): Promise<InvestorResolutionResult> {
    if (!input.slug) return this.unknown("Missing slug.");

    return this.resolveFromQueries(
      [
        { slug: input.slug },
        { sourceKey: input.slug },
        { "sourceMappings.sourceSlug": input.slug },
      ],
      [
        { slug: input.slug },
        { sourceKey: input.slug },
        { "sourceMappings.sourceSlug": input.slug },
      ],
      input,
      {
        confidence: "high",
        matchedBy: "slug",
        reason: "Unique investor slug/source slug match.",
        score: 90,
      },
    );
  }

  private async resolveByName(input: NormalizedInvestorResolverInput): Promise<InvestorResolutionResult> {
    if (!input.normalizedName) return this.unknown("Missing name.");

    return this.resolveFromQueries(
      [
        { normalizedName: input.normalizedName },
        { name: input.name },
      ],
      [
        { normalizedName: input.normalizedName },
        { name: input.name },
      ],
      input,
      {
        confidence: "medium",
        matchedBy: "normalizedName",
        reason: "Unique normalized investor name match.",
        score: 75,
      },
    );
  }

  private async resolveByAliases(input: NormalizedInvestorResolverInput): Promise<InvestorResolutionResult> {
    if (!input.name) return this.unknown("Missing alias value.");

    return this.resolveFromQueries(
      [{ aliases: input.name }, { aliases: input.normalizedName }],
      [{ aliases: input.name }, { aliases: input.normalizedName }],
      input,
      {
        confidence: "medium",
        matchedBy: "aliases",
        reason: "Unique investor alias match.",
        score: 70,
      },
    );
  }

  private async resolveByLinks(input: NormalizedInvestorResolverInput): Promise<InvestorResolutionResult> {
    const urls = this.uniqueStrings([
      input.website,
      input.normalizedWebsite,
      input.twitter,
      input.normalizedTwitter,
      input.linkedin,
      input.normalizedLinkedin,
    ]);
    if (!urls.length) return this.unknown("Missing website/social links.");

    const query = [
      { websiteUrl: { $in: urls } },
      { twitterUrl: { $in: urls } },
      { linkedinUrl: { $in: urls } },
      { website: { $in: urls } },
      { "links.url": { $in: urls } },
      { "links.link": { $in: urls } },
      { "socialmedia.url": { $in: urls } },
      { "socialmedia.link": { $in: urls } },
      { "sourceMappings.sourceUrl": { $in: urls } },
    ];

    return this.resolveFromQueries(query, query, input, {
      confidence: "high",
      matchedBy: "website/social",
      reason: "Unique exact investor website or social link match.",
      score: 85,
    });
  }

  private async resolveByFuzzyName(input: NormalizedInvestorResolverInput): Promise<InvestorResolutionResult> {
    if (!input.normalizedName || input.normalizedName.length < 4) {
      return this.unknown("Missing fuzzy-safe name.");
    }

    const prefix = this.escapeRegex(input.normalizedName.slice(0, Math.min(8, input.normalizedName.length)));
    const regex = new RegExp(`^${prefix}`, "i");
    return this.resolveFromQueries(
      [{ normalizedName: regex }, { name: regex }],
      [{ normalizedName: regex }, { name: regex }],
      input,
      {
        confidence: "low",
        matchedBy: "fuzzyName",
        reason: "Low-confidence prefix name candidate for report/manual review only.",
        score: 40,
      },
    );
  }

  private async resolveFromQueries(
    fundOr: any[],
    personOr: any[],
    input: NormalizedInvestorResolverInput,
    config: InvestorMatchConfig,
  ): Promise<InvestorResolutionResult> {
    if (!fundOr.length && !personOr.length) return this.unknown(`No query for ${config.matchedBy}.`);

    const [funds, persons] = await Promise.all([
      fundOr.length
        ? this.fundsModel.find({ $or: fundOr }).select(this.projection()).limit(25).lean()
        : Promise.resolve([]),
      personOr.length
        ? this.personModel.find({ $or: personOr }).select(this.projection()).limit(25).lean()
        : Promise.resolve([]),
    ]);

    const candidates = this.dedupeCandidates([
      ...(funds as any[]).map((entity) => this.toCandidate("fund", entity, config)),
      ...(persons as any[]).map((entity) => this.toCandidate("person", entity, config)),
    ]);

    return this.toResolution(candidates, input, config);
  }

  private toResolution(
    candidates: InvestorResolverCandidate[],
    input: NormalizedInvestorResolverInput,
    config: InvestorMatchConfig,
  ): InvestorResolutionResult {
    if (!candidates.length) return this.unknown(`No investor candidate matched by ${config.matchedBy}.`);

    const candidateTypes = new Set(candidates.map((candidate) => candidate.type));
    if (candidates.length > 1 || candidateTypes.size > 1) {
      return {
        type: "ambiguous",
        confidence: "none",
        matchedBy: config.matchedBy,
        reason: `Ambiguous investor match: ${candidates.length} candidates matched by ${config.matchedBy}.`,
        candidates,
      };
    }

    const candidate = candidates[0];
    if (["medium", "low"].includes(config.confidence) && input.type !== "unknown" && input.type !== candidate.type) {
      return {
        type: "ambiguous",
        confidence: "none",
        matchedBy: "typeMismatch",
        reason: `Input investor type is ${input.type}, but only ${candidate.type} matched at ${config.confidence} confidence.`,
        candidates,
      };
    }

    return {
      type: candidate.type,
      fundId: candidate.type === "fund" ? candidate.id : undefined,
      personId: candidate.type === "person" ? candidate.id : undefined,
      confidence: config.confidence,
      matchedBy: config.matchedBy,
      reason: config.reason,
      candidates,
    };
  }

  private normalizeInput(input: InvestorResolverInput): NormalizedInvestorResolverInput {
    const dropstabId = this.cleanIdentifier(input.dropstabId || input.sourceId);
    const type = input.type === "fund" || input.type === "person" ? input.type : "unknown";
    return {
      name: this.cleanText(input.name),
      normalizedName: this.normalizeName(input.name),
      slug: this.normalizeSlug(input.slug),
      type,
      source: this.normalizeSource(input.source),
      sourceId: this.cleanIdentifier(input.sourceId),
      sourceKey: this.cleanIdentifier(input.sourceKey),
      sourceUrl: this.cleanUrl(input.sourceUrl, false),
      normalizedSourceUrl: this.cleanUrl(input.sourceUrl, true),
      dropstabId,
      numericDropstabId: this.toNullableNumber(dropstabId),
      website: this.cleanUrl(input.website, false),
      normalizedWebsite: this.cleanUrl(input.website, true),
      twitter: this.cleanUrl(input.twitter, false),
      normalizedTwitter: this.cleanUrl(input.twitter, true),
      linkedin: this.cleanUrl(input.linkedin, false),
      normalizedLinkedin: this.cleanUrl(input.linkedin, true),
    };
  }

  private toCandidate(
    type: "fund" | "person",
    entity: InvestorEntityDoc,
    config: InvestorMatchConfig,
  ): InvestorResolverCandidate {
    return {
      type,
      id: entity._id,
      name: entity.name || "",
      slug: entity.slug,
      score: config.score,
      matchedBy: config.matchedBy,
      reason: config.reason,
    };
  }

  private dedupeCandidates(candidates: InvestorResolverCandidate[]): InvestorResolverCandidate[] {
    const byKey = new Map<string, InvestorResolverCandidate>();
    for (const candidate of candidates) {
      const key = `${candidate.type}:${candidate.id.toString()}`;
      const existing = byKey.get(key);
      if (!existing || existing.score < candidate.score) byKey.set(key, candidate);
    }
    return Array.from(byKey.values()).sort((a, b) => b.score - a.score);
  }

  private projection() {
    return {
      _id: 1,
      name: 1,
      normalizedName: 1,
      slug: 1,
      source: 1,
      sourceKey: 1,
      dropstabId: 1,
      aliases: 1,
      website: 1,
      websiteUrl: 1,
      twitterUrl: 1,
      linkedinUrl: 1,
    };
  }

  private unknown(reason: string): InvestorResolutionResult {
    return {
      type: "unknown",
      confidence: "none",
      matchedBy: "none",
      reason,
      candidates: [],
    };
  }

  private cleanIdentifier(value: any): string {
    return String(value ?? "").trim();
  }

  private cleanText(value: any): string {
    return String(value || "").trim();
  }

  private normalizeName(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSlug(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/^https?:\/\/[^/]+\/?/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizeSource(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private cleanUrl(value: any, normalize: boolean): string {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (!normalize) return raw;
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }

  private toNullableNumber(value: any): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

type NormalizedInvestorResolverInput = {
  name: string;
  normalizedName: string;
  slug: string;
  type: InvestorResolverInputType;
  source: string;
  sourceId: string;
  sourceKey: string;
  sourceUrl: string;
  normalizedSourceUrl: string;
  dropstabId: string;
  numericDropstabId: number | null;
  website: string;
  normalizedWebsite: string;
  twitter: string;
  normalizedTwitter: string;
  linkedin: string;
  normalizedLinkedin: string;
};
