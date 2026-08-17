import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { lookup } from "dns/promises";
import { isIP } from "net";
import { Model } from "mongoose";
import { AssetStorageService } from "./asset-storage.service";
import {
  ExternalAssetMirror,
  ExternalAssetMirrorDocument,
  ExternalAssetMirrorUsage,
} from "./external-asset-mirror.model";
import {
  buildLegacyUploadUrl,
  classifyImageValue,
  contentTypeToExtension,
  isMirrorCandidateCategory,
  normalizeContentType,
  normalizeSourceUrl,
  providerFromCategory,
  sha256,
} from "./image-inventory.utils";

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 10_000;

@Injectable()
export class ExternalAssetMirrorWriteService {
  private readonly logger = new Logger(ExternalAssetMirrorWriteService.name);
  private readonly cache = new Map<string, Promise<string>>();

  constructor(
    @InjectModel(ExternalAssetMirror.name)
    private readonly mirrorModel: Model<ExternalAssetMirrorDocument>,
    private readonly storage: AssetStorageService
  ) {}

  async mirrorUrl(
    sourceUrl?: string | null,
    usage?: ExternalAssetMirrorUsage,
    currentUrl?: string | null
  ): Promise<string | undefined> {
    const source = this.cleanString(sourceUrl);
    const current = this.cleanString(currentUrl);
    if (current && classifyImageValue(current) === "already_r2_assets") {
      return current;
    }
    if (!source) return current;

    const category = classifyImageValue(source);
    if (category === "already_r2_assets") return source;
    if (!isMirrorCandidateCategory(category)) return current || source;

    const normalizedSource = normalizeSourceUrl(source);
    const sourceUrlHash = sha256(normalizedSource);
    const cached = this.cache.get(sourceUrlHash);
    if (cached) {
      const mirrored = await cached;
      if (usage) await this.addUsage(sourceUrlHash, usage);
      return mirrored;
    }

    const promise = this.mirror({
      category,
      current,
      sourceUrl: normalizedSource,
      sourceUrlHash,
      usage,
    });
    this.cache.set(sourceUrlHash, promise);
    return promise;
  }

  private async mirror(params: {
    category: ReturnType<typeof classifyImageValue>;
    current?: string;
    sourceUrl: string;
    sourceUrlHash: string;
    usage?: ExternalAssetMirrorUsage;
  }): Promise<string> {
    const fallback = params.current || params.sourceUrl;
    const existing = await this.mirrorModel
      .findOne({ sourceUrlHash: params.sourceUrlHash })
      .lean()
      .exec();

    if (existing?.status === "ok" && this.cleanString(existing.publicUrl)) {
      if (params.usage) {
        await this.addUsage(params.sourceUrlHash, params.usage);
      }
      return String(existing.publicUrl).trim();
    }

    try {
      const downloadUrl =
        params.category === "local_uploads_relative"
          ? buildLegacyUploadUrl(params.sourceUrl)
          : params.sourceUrl;
      const downloaded = await this.downloadImage(downloadUrl);
      const extension = contentTypeToExtension(downloaded.contentType);
      if (!extension) {
        throw new Error(`Unsupported image type ${downloaded.contentType}`);
      }
      const provider = providerFromCategory(params.category);
      const stored = await this.storage.writeFile({
        buffer: downloaded.buffer,
        key: `external/${provider}/${params.sourceUrlHash}.${extension}`,
        mimeType: downloaded.contentType,
        originalName: `${params.sourceUrlHash}.${extension}`,
      });
      const now = new Date();
      await this.mirrorModel.updateOne(
        { sourceUrlHash: params.sourceUrlHash },
        {
          $setOnInsert: {
            sourceUrl: params.sourceUrl,
            sourceUrlHash: params.sourceUrlHash,
            firstSeenAt: now,
            retryCount: 0,
          },
          $set: {
            provider,
            assetKey: stored.key,
            publicUrl: stored.url,
            contentType: downloaded.contentType,
            size: downloaded.buffer.length,
            status: "ok",
            mirroredAt: now,
            lastCheckedAt: now,
          },
          $unset: {
            error: "",
            lastError: "",
            lastErrorAt: "",
            httpStatus: "",
          },
          ...(params.usage ? { $addToSet: { usages: params.usage } } : {}),
        },
        { upsert: true }
      );
      return stored.url;
    } catch (error: any) {
      const message = error?.message || String(error);
      const now = new Date();
      await this.mirrorModel
        .updateOne(
          { sourceUrlHash: params.sourceUrlHash },
          {
            $setOnInsert: {
              sourceUrl: params.sourceUrl,
              sourceUrlHash: params.sourceUrlHash,
              firstSeenAt: now,
              retryCount: 0,
            },
            $set: {
              provider: providerFromCategory(params.category),
              status: "failed",
              error: message,
              lastError: message,
              lastErrorAt: now,
              lastCheckedAt: now,
              ...(typeof error?.response?.status === "number"
                ? { httpStatus: error.response.status }
                : {}),
            },
            $inc: { retryCount: 1 },
            ...(params.usage ? { $addToSet: { usages: params.usage } } : {}),
          },
          { upsert: true }
        )
        .catch(() => undefined);
      this.logger.warn(
        `External activity asset mirror failed for ${params.sourceUrl}: ${message}`
      );
      return fallback;
    }
  }

  private async addUsage(
    sourceUrlHash: string,
    usage: ExternalAssetMirrorUsage
  ): Promise<void> {
    await this.mirrorModel.updateOne(
      { sourceUrlHash },
      { $addToSet: { usages: usage }, $set: { lastCheckedAt: new Date() } }
    );
  }

  private async downloadImage(
    initialUrl: string
  ): Promise<{ buffer: Buffer; contentType: string }> {
    let url = initialUrl;

    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      await this.assertPublicHttpUrl(url);
      const response = await axios.get<ArrayBuffer>(url, {
        headers: {
          Accept: "image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8",
          "User-Agent": "FOMO activity asset mirror/1.0",
        },
        maxContentLength: this.maxUploadBytes(),
        maxRedirects: 0,
        responseType: "arraybuffer",
        timeout: DEFAULT_TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      if (response.status >= 300) {
        const location = this.cleanString(response.headers.location);
        if (!location || redirect === MAX_REDIRECTS) {
          throw new Error("Too many or invalid image redirects");
        }
        url = new URL(location, url).toString();
        continue;
      }

      const buffer = Buffer.from(response.data);
      if (!buffer.length || buffer.length > this.maxUploadBytes()) {
        throw new Error("Downloaded image is empty or too large");
      }
      const detectedContentType = this.detectImageContentType(buffer);
      const headerContentType = normalizeContentType(
        response.headers["content-type"] as string
      );
      const contentType = detectedContentType || headerContentType;
      if (!contentTypeToExtension(contentType)) {
        throw new Error(`Unsupported image type ${contentType || "unknown"}`);
      }

      return { buffer, contentType };
    }

    throw new Error("Unable to download image");
  }

  private async assertPublicHttpUrl(value: string): Promise<void> {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error("Image URL must use HTTP or HTTPS");
    }
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local")) {
      throw new Error("Private image host is not allowed");
    }
    const addresses = isIP(hostname)
      ? [{ address: hostname }]
      : await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => this.isPrivateIp(address))) {
      throw new Error("Private image host is not allowed");
    }
  }

  private isPrivateIp(address: string): boolean {
    const normalized = address.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9")) return true;
    if (normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
    if (normalized.startsWith("::ffff:")) {
      return this.isPrivateIp(normalized.slice("::ffff:".length));
    }
    if (isIP(normalized) !== 4) return false;

    const [a, b] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  private detectImageContentType(buffer: Buffer): string {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    if (buffer.length >= 6 && /^GIF8[79]a$/.test(buffer.slice(0, 6).toString("ascii"))) {
      return "image/gif";
    }
    if (
      buffer.length >= 12 &&
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp";
    }
    return "";
  }

  private maxUploadBytes(): number {
    const configuredMb = Number(process.env.R2_MAX_UPLOAD_MB || 10);
    const maxMb = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : 10;
    return maxMb * 1024 * 1024;
  }

  private cleanString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }
}
