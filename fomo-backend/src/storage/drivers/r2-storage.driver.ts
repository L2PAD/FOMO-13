import { BadRequestException } from "@nestjs/common";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import {
  AssetStorageDriver,
  AssetWriteParams,
  StoredAsset,
} from "../types";

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, "");
const trimTrailingSlash = (value: string): string => value.replace(/\/+$/g, "");

export class R2StorageDriver implements AssetStorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly cacheControl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const endpoint =
      process.env.R2_ENDPOINT?.trim() ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

    this.bucket = process.env.R2_BUCKET?.trim() || "";
    this.publicBaseUrl = trimTrailingSlash(
      process.env.R2_PUBLIC_BASE_URL?.trim() || "",
    );
    this.cacheControl =
      process.env.R2_CACHE_CONTROL?.trim() ||
      "public, max-age=31536000, immutable";

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucket || !this.publicBaseUrl) {
      throw new Error(
        "R2 storage is selected but R2 endpoint, credentials, bucket, or public base URL are missing",
      );
    }

    this.client = new S3Client({
      endpoint,
      region: process.env.R2_REGION?.trim() || "auto",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async writeFile(params: AssetWriteParams): Promise<StoredAsset> {
    const key = this.generateKey(params);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType,
        CacheControl: this.cacheControl,
      }),
    );

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
      mimeType: params.mimeType,
      size: params.buffer.length,
      driver: "r2",
    };
  }

  async removeFile(keyOrUrl: string): Promise<void> {
    const key = this.extractOwnedKey(keyOrUrl);
    if (!key) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private generateKey(params: AssetWriteParams): string {
    if (params.key) {
      return trimSlashes(params.key);
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const folder = params.folder ? trimSlashes(params.folder) : `uploads/${year}/${month}`;
    const extension = this.getExtensionFromMime(params.mimeType);

    return `${folder}/${uuidv4()}${extension}`;
  }

  private getExtensionFromMime(mimeType?: string): string {
    switch ((mimeType || "").toLowerCase()) {
      case "image/jpeg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      default:
        throw new BadRequestException("Unsupported image type");
    }
  }

  private extractOwnedKey(keyOrUrl: string): string | null {
    const value = String(keyOrUrl || "").trim().split("?")[0].split("#")[0];
    if (!value) return null;

    if (value.startsWith(`${this.publicBaseUrl}/`)) {
      return value.slice(this.publicBaseUrl.length + 1).replace(/^\/+/, "");
    }

    if (/^https?:\/\//i.test(value) || value.startsWith("/uploads/")) {
      return null;
    }

    const normalized = value.replace(/^\/+/, "");
    if (
      /^(?:uploads|launchpad)\/\d{4}\/\d{2}\/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(
        normalized,
      )
    ) {
      return normalized;
    }

    return null;
  }
}
