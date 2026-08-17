import { BadRequestException, Injectable } from "@nestjs/common";
import { AssetStorageDriver, AssetStorageDriverName, StoredAsset } from "./types";
import { LocalStorageDriver } from "./drivers/local-storage.driver";
import { R2StorageDriver } from "./drivers/r2-storage.driver";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

@Injectable()
export class AssetStorageService {
  private readonly localDriver = new LocalStorageDriver();
  private r2Driver?: R2StorageDriver;

  writeFile(params: {
    buffer: Buffer | Uint8Array;
    originalName: string;
    key?: string;
    folder?: string;
    mimeType?: string;
  }): Promise<StoredAsset> | StoredAsset {
    const driverName = this.getDriverName();
    const buffer = Buffer.isBuffer(params.buffer)
      ? params.buffer
      : Buffer.from(params.buffer);
    const mimeType = this.shouldValidateImages(driverName)
      ? this.validateImage({
          buffer,
          originalName: params.originalName,
          mimeType: params.mimeType,
        })
      : this.normalizeMimeType(params.mimeType);

    return this.getDriver(driverName).writeFile({
      ...params,
      buffer,
      mimeType,
    });
  }

  removeFile(keyOrUrl: string): Promise<void> | void {
    const driverName = this.getDriverName();

    return this.getDriver(driverName).removeFile?.(keyOrUrl);
  }

  writeLocalFileWithOriginalName(params: {
    buffer: Buffer | Uint8Array;
    originalName: string;
    mimeType?: string;
  }): StoredAsset {
    const buffer = Buffer.isBuffer(params.buffer)
      ? params.buffer
      : Buffer.from(params.buffer);

    return this.localDriver.writeFileWithOriginalName({
      ...params,
      buffer,
      mimeType: this.normalizeMimeType(params.mimeType),
    });
  }

  private getDriverName(): AssetStorageDriverName {
    const driver = (process.env.STORAGE_DRIVER || "local").trim().toLowerCase();

    return driver === "r2" ? "r2" : "local";
  }

  private getDriver(driverName: AssetStorageDriverName): AssetStorageDriver {
    if (driverName === "r2") {
      if (!this.r2Driver) {
        this.r2Driver = new R2StorageDriver();
      }

      return this.r2Driver;
    }

    return this.localDriver;
  }

  private shouldValidateImages(driverName: AssetStorageDriverName): boolean {
    const configured = process.env.STORAGE_VALIDATE_IMAGES?.trim().toLowerCase();

    if (configured === "true") return true;
    if (configured === "false") return false;

    return driverName === "r2";
  }

  private validateImage(params: {
    buffer: Buffer;
    originalName?: string;
    mimeType?: string;
  }): string {
    if (!params.buffer.length) {
      throw new BadRequestException("File is empty");
    }

    const maxUploadMb = Number(process.env.R2_MAX_UPLOAD_MB || 10);
    const maxUploadBytes =
      (Number.isFinite(maxUploadMb) && maxUploadMb > 0 ? maxUploadMb : 10) *
      1024 *
      1024;

    if (params.buffer.length > maxUploadBytes) {
      throw new BadRequestException("File is too large");
    }

    const normalizedMimeType =
      this.normalizeMimeType(params.mimeType) ||
      this.inferMimeTypeFromName(params.originalName);
    const detectedMimeType = this.detectImageMimeType(params.buffer);
    const mimeType = detectedMimeType || normalizedMimeType;

    if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException("Unsupported image type");
    }

    if (normalizedMimeType && detectedMimeType && normalizedMimeType !== detectedMimeType) {
      throw new BadRequestException("Image MIME type does not match file content");
    }

    if (!detectedMimeType) {
      throw new BadRequestException("Invalid image content");
    }

    return mimeType;
  }

  private normalizeMimeType(mimeType?: string): string | undefined {
    const normalized = String(mimeType || "")
      .trim()
      .toLowerCase()
      .split(";")[0];

    return normalized || undefined;
  }

  private inferMimeTypeFromName(fileName?: string): string | undefined {
    const match = String(fileName || "")
      .trim()
      .toLowerCase()
      .match(/(\.[a-z0-9]+)$/);

    return match ? MIME_BY_EXTENSION[match[1]] : undefined;
  }

  private detectImageMimeType(buffer: Buffer): string | undefined {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }

    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return "image/png";
    }

    if (
      buffer.length >= 6 &&
      buffer.slice(0, 6).toString("ascii").match(/^GIF8[79]a$/)
    ) {
      return "image/gif";
    }

    if (
      buffer.length >= 12 &&
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp";
    }

    return undefined;
  }
}
