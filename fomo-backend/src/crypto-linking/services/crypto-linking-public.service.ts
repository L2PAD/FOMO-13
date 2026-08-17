import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import {
  InvestorResolutionResult,
  InvestorResolverInput,
  InvestorResolverService,
} from "./investor-resolver.service";
import {
  ProjectResolverConfidence,
  ProjectResolverInput,
  ProjectResolverProjectLink,
  ProjectResolverResult,
  ProjectResolverService,
} from "./project-resolver.service";

export type CryptoLinkingProjectWriteFields = {
  projectId?: Types.ObjectId;
  projectLinks?: Array<ProjectResolverProjectLink & { linkedAt: Date }>;
};

@Injectable()
export class CryptoLinkingPublicService {
  constructor(
    private readonly projectResolverService: ProjectResolverService,
    private readonly investorResolverService: InvestorResolverService,
  ) {}

  async resolveProject(input: ProjectResolverInput | ProjectResolverInput[]): Promise<ProjectResolverResult> {
    const inputs = Array.isArray(input) ? input : [input];
    let best: ProjectResolverResult | null = null;

    for (const item of inputs.filter((value) => this.hasProjectResolverInput(value))) {
      const result = await this.projectResolverService.resolve(item);
      best = this.pickBetterProjectResult(best, result);

      if (this.isAutoWritableProjectResult(result)) {
        return result;
      }
    }

    return best || this.noProjectMatch("No project resolver input.");
  }

  async resolveProjectWriteFields(
    input: ProjectResolverInput | ProjectResolverInput[],
    allowedConfidence: ProjectResolverConfidence[] = ["exact", "high"],
  ): Promise<CryptoLinkingProjectWriteFields> {
    const result = await this.resolveProject(input);
    return this.toProjectWriteFields(result, allowedConfidence);
  }

  async resolveInvestor(input: InvestorResolverInput): Promise<InvestorResolutionResult> {
    return this.investorResolverService.resolve(input);
  }

  async resolveInvestors(inputs: InvestorResolverInput[]): Promise<InvestorResolutionResult[]> {
    return this.investorResolverService.resolveMany(inputs);
  }

  private toProjectWriteFields(
    result: ProjectResolverResult,
    allowedConfidence: ProjectResolverConfidence[],
  ): CryptoLinkingProjectWriteFields {
    if (
      !result.projectId ||
      result.unsafe ||
      !allowedConfidence.includes(result.confidence)
    ) {
      return {};
    }

    const linkedAt = new Date();
    const projectLinks = (result.projectLinks || [])
      .filter((link) => link.projectId && link.projectType)
      .map((link) => ({ ...link, linkedAt }));

    return {
      projectId: result.projectId,
      ...(projectLinks.length ? { projectLinks } : {}),
    };
  }

  private isAutoWritableProjectResult(result: ProjectResolverResult): boolean {
    return Boolean(
      result.projectId &&
        !result.unsafe &&
        (result.confidence === "exact" || result.confidence === "high"),
    );
  }

  private pickBetterProjectResult(
    current: ProjectResolverResult | null,
    candidate: ProjectResolverResult,
  ): ProjectResolverResult {
    if (!current) return candidate;

    const candidateScore = this.projectResultScore(candidate);
    const currentScore = this.projectResultScore(current);
    return candidateScore > currentScore ? candidate : current;
  }

  private projectResultScore(result: ProjectResolverResult): number {
    const confidenceScore: Record<ProjectResolverConfidence, number> = {
      exact: 100,
      high: 90,
      medium: 70,
      low: 40,
      none: 0,
    };
    return (result.projectId ? 1000 : 0) + confidenceScore[result.confidence] - (result.unsafe ? 500 : 0);
  }

  private hasProjectResolverInput(input: ProjectResolverInput): boolean {
    if (!input) return false;
    return [
      input.source,
      input.sourceId,
      input.sourceKey,
      input.externalId,
      input.sourceUrl,
      input.coinSlug,
      input.slug,
      input.name,
      input.symbol,
      input.coinGeckoId,
      input.coinMarketCapId,
      input.dropstabId,
      input.cryptorankId,
      input.icodropsId,
    ].some((value) => String(value || "").trim());
  }

  private noProjectMatch(reason: string): ProjectResolverResult {
    return {
      projectId: null,
      confidence: "none",
      matchedBy: "none",
      reason,
    };
  }
}
