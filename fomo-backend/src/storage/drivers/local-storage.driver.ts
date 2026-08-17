import { BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { ensureUploadsDir, UPLOADS_DIR } from "src/config/uploads";
import {
  AssetStorageDriver,
  AssetWriteParams,
  StoredAsset,
} from "../types";

export class LocalStorageDriver implements AssetStorageDriver {
  private sanitizeFileNamePart(value?: string): string {
    const normalized = (value || "file")
      .normalize("NFKD")
      .replace(/[^\x00-\x7F]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return normalized || "file";
  }

  private getSafeExtension(fileName?: string, fallbackExtension = ".bin"): string {
    const rawExtension = path.extname(path.basename(fileName || "")).toLowerCase();
    const safeExtension = rawExtension.replace(/[^.a-z0-9]/g, "");

    if (safeExtension && safeExtension !== ".") {
      return safeExtension;
    }

    return fallbackExtension.startsWith(".")
      ? fallbackExtension.toLowerCase()
      : `.${fallbackExtension.toLowerCase()}`;
  }

  private generateFileName(originalFileName?: string, fallbackExtension = ".bin"): string {
    const originalBaseName = path.basename(originalFileName || "file");
    const baseNameWithoutExt = path.basename(
      originalBaseName,
      path.extname(originalBaseName),
    );
    const sanitizedBaseName = this.sanitizeFileNamePart(baseNameWithoutExt).slice(0, 80);
    const extension = this.getSafeExtension(originalBaseName, fallbackExtension);
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 100000);

    return `${timestamp}_${randomNumber}_${sanitizedBaseName}${extension}`;
  }

  private normalizeStoredPath(filePath?: string): string {
    const value = String(filePath || "")
      .trim()
      .split("?")[0]
      .split("#")[0];

    return value.replace(/^\/+/, "").replace(/^uploads\//, "");
  }

  private resolveAbsolutePath(filePath: string): string {
    const normalizedPath = this.normalizeStoredPath(filePath);
    const safeFileName = path.basename(normalizedPath);

    return path.join(UPLOADS_DIR, safeFileName);
  }

  writeFile(params: AssetWriteParams): StoredAsset {
    ensureUploadsDir();

    const fileName = this.generateFileName(params.originalName);
    const absoluteFilePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(absoluteFilePath, params.buffer);
    console.log(`${fileName} uploaded`);

    return {
      key: fileName,
      url: `/${fileName}`,
      mimeType: params.mimeType,
      size: params.buffer.length,
      driver: "local",
    };
  }

  writeFileWithOriginalName(params: AssetWriteParams): StoredAsset {
    ensureUploadsDir();

    const safeName = this.sanitizeOriginalFileName(params.originalName);
    const absoluteFilePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(absoluteFilePath, params.buffer);
    console.log(`${safeName} migrated`);

    return {
      key: safeName,
      url: `/${safeName}`,
      mimeType: params.mimeType,
      size: params.buffer.length,
      driver: "local",
    };
  }

  removeFile(keyOrUrl: string): void {
    if (!keyOrUrl) return;

    const absoluteFilePath = this.resolveAbsolutePath(keyOrUrl);

    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
      console.log("removed " + keyOrUrl);
    }
  }

  private sanitizeOriginalFileName(originalFileName?: string): string {
    const baseName = path.basename(String(originalFileName || "").trim());
    const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "");

    if (!safeName || safeName === "." || safeName === "..") {
      throw new BadRequestException("Invalid original filename");
    }

    return safeName;
  }
}
