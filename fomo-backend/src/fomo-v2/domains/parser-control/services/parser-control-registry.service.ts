import { Injectable } from "@nestjs/common";
import { FomoV2ActivitySourceImportService } from "../../activities/services/activity-source-import.service";
import { FomoV2BackerProfileImportService } from "../../backers/services/backer-profile-import.service";
import { FomoV2FundingImportDryRunService } from "../../funding/services/funding-import-dry-run.service";
import { FomoV2IcodropsFundingFallbackImportService } from "../../funding/services/icodrops-funding-fallback-import.service";
import { FomoV2IntelFundraisingGapFillDryRunService } from "../../funding/services/intel-fundraising-gap-fill-dry-run.service";
import { IcoProjectProfileImportService } from "../../ico/services/ico-project-profile-import.service";
import { FomoV2MarketProjectDataUpdateService } from "../../market/services/market-project-data-update.service";
import { FomoV2UnlockEventsImportService } from "../../unlocks/services/unlock-events-import.service";
import { FomoV2VestingAllocationScheduleImportService } from "../../vesting/services/vesting-allocation-schedule-import.service";
import { FomoV2ManagedParserDefinition } from "../parser-control.constants";
import {
  FomoV2PostWriteMaterializationProgress,
  FomoV2PostWriteMaterializationService,
} from "./post-write-materialization.service";

export interface FomoV2ManagedParserExecutionResult {
  summary: Record<string, any>;
  partial: boolean;
}

@Injectable()
export class FomoV2ParserControlRegistryService {
  constructor(
    private readonly activityImport: FomoV2ActivitySourceImportService,
    private readonly backerImport: FomoV2BackerProfileImportService,
    private readonly fundingImport: FomoV2FundingImportDryRunService,
    private readonly icodropsFundingImport: FomoV2IcodropsFundingFallbackImportService,
    private readonly intelFundingImport: FomoV2IntelFundraisingGapFillDryRunService,
    private readonly icoProfileImport: IcoProjectProfileImportService,
    private readonly marketImport: FomoV2MarketProjectDataUpdateService,
    private readonly unlockImport: FomoV2UnlockEventsImportService,
    private readonly vestingImport: FomoV2VestingAllocationScheduleImportService,
    private readonly postWriteMaterialization: FomoV2PostWriteMaterializationService
  ) {}

  async execute(
    definition: FomoV2ManagedParserDefinition,
    options: {
      write: boolean;
      limit: number;
      snapshotId?: string;
      upstreamRunId?: string;
      assertExecutionActive?: () => void | Promise<void>;
      onMaterializationProgress?: (
        progress: FomoV2PostWriteMaterializationProgress
      ) => void | Promise<void>;
    }
  ): Promise<FomoV2ManagedParserExecutionResult> {
    const snapshotId = String(options.snapshotId || "").trim() || undefined;
    if (definition.writeRequiresSnapshot && options.write && !snapshotId) {
      throw new Error(
        `Managed write for ${definition.parserKey} requires an exact immutable snapshotId.`,
      );
    }
    if (snapshotId && !definition.upstreamParserKey) {
      throw new Error(
        `Managed parser ${definition.parserKey} does not support snapshot imports.`,
      );
    }
    const snapshotOptions = snapshotId
      ? {
          snapshotId,
          upstreamRunId: options.upstreamRunId,
          upstreamParserKey: definition.upstreamParserKey,
          sourceType: definition.sourceType,
        }
      : {};
    const limit = boundedLimit(
      options.limit,
      definition.defaultLimit,
      snapshotId ? 100_000 : 1_000,
    );
    let result: Record<string, any>;

    switch (definition.parserKey) {
      case "market:coingecko": {
        const tiers = [];
        for (const tier of ["HOT", "WARM", "COLD"] as const) {
          await options.assertExecutionActive?.();
          tiers.push(
            await this.marketImport.runTier(tier, {
              dryRun: !options.write,
              ignoreJobsEnabled: true,
              ignoreLocalRun: true,
              ignoreTierEnabled: true,
              limit,
              ...snapshotOptions,
              ...(options.assertExecutionActive
                ? { assertExecutionActive: options.assertExecutionActive }
                : {}),
            })
          );
          await options.assertExecutionActive?.();
        }
        result = { mode: options.write ? "write" : "dry-run", tiers };
        break;
      }
      case "funding:dropstab":
        result = await this.fundingImport.run({
          sourceType: "dropstab",
          limit,
          write: options.write,
          enrichOnly: false,
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "funding:icodrops":
        result = await this.icodropsFundingImport.run({
          limit,
          write: options.write,
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "funding:intel_fundraising":
        result = await this.intelFundingImport.run({
          limit,
          write: options.write,
          // This managed pipeline owns feed-round gap filling. Participant-only
          // reconciliation remains an explicit maintenance runner.
          feedRounds: true,
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "ico:icodrops":
        result = await this.icoProfileImport.run({
          sourceType: "icodrops",
          limit,
          write: options.write,
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "backers:dropstab":
      case "backers:intel":
        result = await this.backerImport.run({
          sourceType: definition.sourceType,
          limit,
          write: options.write,
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "vesting:dropstab":
        result = await this.vestingImport.run({
          sourceType: "dropstab",
          limit,
          write: options.write,
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "unlocks:dropstab":
        result = await this.unlockImport.run({
          sourceType: "dropstab",
          limit,
          write: options.write,
          dryRun: !options.write,
          mode: "next-only",
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "activities:dropstab":
      case "activities:icodrops":
        result = await this.activityImport.importPending({
          source: "parser",
          providerSourceType: definition.sourceType,
          limit,
          write: options.write,
          persistCheckpoint: options.write,
          ...snapshotOptions,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      case "activities:legacy":
        result = await this.activityImport.importPending({
          source: "legacy",
          limit,
          write: options.write,
          persistCheckpoint: options.write,
          ...(options.assertExecutionActive
            ? { assertExecutionActive: options.assertExecutionActive }
            : {}),
        });
        break;
      default:
        throw new Error(
          `Managed parser adapter is not registered: ${definition.parserKey}`
        );
    }

    const materialization = await this.postWriteMaterialization.run({
      parserKey: definition.parserKey,
      write: options.write,
      assertExecutionActive: options.assertExecutionActive,
      onProgress: options.onMaterializationProgress,
    });

    return {
      summary: {
        ...summarizeParserResult(result),
        materialization,
      },
      partial:
        parserResultIsPartial(result) || materialization.status === "partial",
    };
  }
}

function boundedLimit(
  value: number,
  fallback: number,
  maximum = 1_000
): number {
  const parsed = Math.floor(Number(value || fallback));
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(maximum, parsed);
}

function parserResultIsPartial(value: any): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(parserResultIsPartial);
  if (Array.isArray(value.errors) && value.errors.length > 0) return true;
  if (
    Number(value.failed || value.counts?.failed || value.eventsFailed || 0) > 0
  ) {
    return true;
  }
  if (value.results && typeof value.results === "object") {
    return Object.values(value.results).some((entry: any) =>
      parserResultIsPartial(entry)
    );
  }
  if (Array.isArray(value.tiers))
    return value.tiers.some(parserResultIsPartial);
  return false;
}

/** Keep operational history useful without persisting full parser payloads. */
export function summarizeParserResult(value: any): Record<string, any> {
  if (!value || typeof value !== "object") return { result: value };
  const summary: Record<string, any> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (
      entry === null ||
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      summary[key] = entry;
      continue;
    }
    if (Array.isArray(entry)) {
      summary[`${key}Count`] = entry.length;
      if (["errors", "warnings"].includes(key) && entry.length) {
        summary[key] = entry
          .slice(0, 5)
          .map((item) =>
            typeof item === "string"
              ? item.slice(0, 500)
              : String((item as any)?.message || JSON.stringify(item)).slice(
                  0,
                  500
                )
          );
      }
      continue;
    }
    if (entry && typeof entry === "object") {
      const primitiveEntries = Object.entries(entry).filter(([, nested]) =>
        ["string", "number", "boolean"].includes(typeof nested)
      );
      if (primitiveEntries.length) {
        summary[key] = Object.fromEntries(primitiveEntries.slice(0, 50));
      }
    }
  }
  return summary;
}
