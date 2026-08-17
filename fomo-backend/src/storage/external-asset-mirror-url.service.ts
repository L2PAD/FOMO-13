import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ExternalAssetMirror,
  ExternalAssetMirrorDocument,
} from "./external-asset-mirror.model";
import {
  classifyImageValue,
  normalizeSourceUrl,
  sha256,
} from "./image-inventory.utils";

@Injectable()
export class ExternalAssetMirrorUrlService {
  private readonly cache = new Map<string, Promise<string | undefined>>();

  constructor(
    @InjectModel(ExternalAssetMirror.name)
    private readonly mirrorModel: Model<ExternalAssetMirrorDocument>,
  ) {}

  async preferMirroredUrl(
    sourceUrl?: string | null,
    currentUrl?: string | null,
  ): Promise<string | undefined> {
    const source = this.cleanString(sourceUrl);
    const current = this.cleanString(currentUrl);

    if (current && classifyImageValue(current) === "already_r2_assets") return current;
    if (source && classifyImageValue(source) === "already_r2_assets") return source;

    const mirrored = source ? await this.findPublicUrl(source) : undefined;
    if (mirrored) return mirrored;

    return current;
  }

  private findPublicUrl(sourceUrl: string): Promise<string | undefined> {
    const normalized = normalizeSourceUrl(sourceUrl);
    const key = sha256(normalized);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const lookup = this.mirrorModel
      .findOne(
        {
          sourceUrlHash: key,
          status: "ok",
          publicUrl: { $type: "string", $ne: "" },
        },
        { publicUrl: 1 },
      )
      .lean()
      .then((mapping: any) => this.cleanString(mapping?.publicUrl));

    this.cache.set(key, lookup);
    return lookup;
  }

  private cleanString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }
}
