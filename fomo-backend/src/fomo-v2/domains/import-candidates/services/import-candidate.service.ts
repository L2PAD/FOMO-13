import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeStorageAliases,
} from "../../../shared/source-policy";
import {
  buildImportCandidateFingerprint,
  cleanImportCandidateString,
  normalizeImportCandidateSlug,
  normalizeImportCandidateText,
  normalizeImportCandidateUrl,
} from "../helpers";
import {
  FomoV2ImportCandidateInput,
  FomoV2ImportCandidateUpsertResult,
} from "../types";
import {
  FomoV2ImportCandidate,
  FomoV2ImportCandidateDocument,
} from "../models";

@Injectable()
export class FomoV2ImportCandidateService {
  constructor(
    @InjectModel(FomoV2ImportCandidate.name)
    private readonly importCandidateModel: Model<FomoV2ImportCandidateDocument>
  ) {}

  async createOrUpdateCandidate(
    input: FomoV2ImportCandidateInput
  ): Promise<FomoV2ImportCandidateUpsertResult<FomoV2ImportCandidateDocument>> {
    const payload = this.preparePayload(input);
    const identityFingerprints = input.candidateFingerprint
      ? [payload.candidateFingerprint]
      : projectSourceTypeStorageAliases(payload.sourceType).map((sourceType) =>
          buildImportCandidateFingerprint({ ...payload, sourceType })
        );
    const now = new Date();
    const syncRunId = this.syncRunId(input.syncRunId);
    const set: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (
        value === undefined ||
        ["payload", "normalizedPayload", "metadata", "status"].includes(key)
      ) {
        continue;
      }
      set[key] = { $literal: value };
    }
    set.status = { $ifNull: ["$status", { $literal: payload.status || "open" }] };
    set.firstSeenAt = { $ifNull: ["$firstSeenAt", { $literal: now }] };
    set.lastSeenAt = { $literal: now };
    set.seenCount = { $add: [{ $ifNull: ["$seenCount", 0] }, 1] };
    set.payload = {
      $mergeObjects: [
        { $ifNull: ["$payload", {}] },
        { $literal: payload.payload || {} },
      ],
    };
    set.normalizedPayload = {
      $mergeObjects: [
        { $ifNull: ["$normalizedPayload", {}] },
        { $literal: payload.normalizedPayload || {} },
      ],
    };
    set.metadata = {
      $mergeObjects: [
        { $ifNull: ["$metadata", {}] },
        { $literal: payload.metadata || {} },
      ],
    };
    if (syncRunId !== undefined) {
      set.createdBySyncRunId = {
        $ifNull: ["$createdBySyncRunId", { $literal: syncRunId }],
      };
      set.updatedBySyncRunId = { $literal: syncRunId };
    }

    const raw = await (this.importCandidateModel as any).findOneAndUpdate(
      {
        candidateFingerprint: {
          $in: Array.from(
            new Set([payload.candidateFingerprint, ...identityFingerprints])
          ),
        },
      },
      [{ $set: set }],
      {
        upsert: true,
        new: true,
        rawResult: true,
      }
    );
    const candidate = raw?.value || raw;
    if (!candidate) {
      throw new Error("Import candidate atomic upsert returned no document.");
    }
    return {
      candidate,
      created: Boolean(
        raw?.lastErrorObject?.upserted ||
          raw?.lastErrorObject?.updatedExisting === false
      ),
      candidateFingerprint: payload.candidateFingerprint,
    };
  }

  createOrUpdateProjectCandidate(
    input: Omit<FomoV2ImportCandidateInput, "entityType">
  ): Promise<FomoV2ImportCandidateUpsertResult<FomoV2ImportCandidateDocument>> {
    return this.createOrUpdateCandidate({ ...input, entityType: "project" });
  }

  createOrUpdateBackerCandidate(
    input: Omit<FomoV2ImportCandidateInput, "entityType">
  ): Promise<FomoV2ImportCandidateUpsertResult<FomoV2ImportCandidateDocument>> {
    return this.createOrUpdateCandidate({ ...input, entityType: "backer" });
  }

  private preparePayload(input: FomoV2ImportCandidateInput): any {
    const domain = normalizeImportCandidateText(input.domain);
    const entityType = normalizeImportCandidateText(input.entityType);
    const sourceType = normalizeProjectSourceType(input.sourceType);
    if (!domain) throw new Error("Import candidate domain is required.");
    if (!entityType) throw new Error("Import candidate entityType is required.");
    if (!sourceType) throw new Error("Import candidate sourceType is required.");

    const name = cleanImportCandidateString(input.name);
    const symbol = cleanImportCandidateString(input.symbol);
    const slug = cleanImportCandidateString(input.slug || input.sourceSlug);
    const normalizedName =
      cleanImportCandidateString(input.normalizedName) ||
      normalizeImportCandidateText(name);
    const normalizedSymbol =
      cleanImportCandidateString(input.normalizedSymbol) ||
      normalizeImportCandidateText(symbol);
    const normalizedSlug =
      cleanImportCandidateString(input.normalizedSlug) ||
      normalizeImportCandidateSlug(slug);
    const payload = cleanObject({
      domain,
      entityType,
      sourceType,
      sourceId: cleanImportCandidateString(input.sourceId),
      sourceSlug: normalizeImportCandidateSlug(input.sourceSlug),
      sourceUrl: normalizeImportCandidateUrl(input.sourceUrl),
      sourcePath: cleanImportCandidateString(input.sourcePath),
      name,
      symbol,
      slug,
      normalizedName,
      normalizedSymbol,
      normalizedSlug,
      payload: input.payload || {},
      normalizedPayload: input.normalizedPayload || {},
      status: input.status,
      metadata: input.metadata || {},
    });

    const candidateFingerprint = buildImportCandidateFingerprint(payload);
    const explicitFingerprint = cleanImportCandidateString(
      input.candidateFingerprint
    );
    if (explicitFingerprint && explicitFingerprint !== candidateFingerprint) {
      throw new Error(
        "Import candidateFingerprint must match the canonical source-scoped identity."
      );
    }
    return { ...payload, candidateFingerprint };
  }

  private syncRunId(value: any): Types.ObjectId | string | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = cleanImportCandidateString(value);
    return text && Types.ObjectId.isValid(text)
      ? new Types.ObjectId(text)
      : text;
  }
}

function cleanObject<T extends Record<string, any>>(input: T): T {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output as T;
}
