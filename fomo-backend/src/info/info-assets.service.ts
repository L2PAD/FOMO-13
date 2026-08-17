import { BadRequestException, Injectable } from "@nestjs/common";

import { FilesService } from "src/files/files.service";
import { INFO_ALLOWED_RASTER_MIME_TYPES } from "./info.constants";

type UploadedInfoAsset = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

@Injectable()
export class InfoAssetsService {
  constructor(private readonly files: FilesService) {}

  async upload(
    file: UploadedInfoAsset | undefined,
    origin?: string
  ): Promise<Record<string, unknown>> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Image file is required");
    }
    if (file.buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException("Image must not exceed 5 MB");
    }

    const declaredMime = String(file.mimetype || "")
      .toLowerCase()
      .split(";")[0];
    const detectedMime = this.detectMime(file.buffer);
    if (
      !detectedMime ||
      !INFO_ALLOWED_RASTER_MIME_TYPES.has(detectedMime) ||
      (declaredMime &&
        declaredMime !== detectedMime &&
        !(declaredMime === "image/jpg" && detectedMime === "image/jpeg"))
    ) {
      throw new BadRequestException(
        "Only valid PNG, JPEG, WebP or GIF images are allowed"
      );
    }

    const storedUrl = await this.files.writeFile({
      ...file,
      mimetype: detectedMime,
    });
    const url = this.normalizeUrl(storedUrl);
    const filename = this.filenameFromUrl(url);
    return {
      filename,
      url,
      full_url:
        /^https?:\/\//i.test(url) || !origin
          ? url
          : `${origin.replace(/\/+$/, "")}${url}`,
      mime_type: detectedMime,
      size: file.buffer.length,
    };
  }

  private normalizeUrl(input: string): string {
    const value = String(input || "").trim();
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/uploads/")) return value;
    return `/uploads/${value.replace(/^\/+/, "").replace(/^uploads\//, "")}`;
  }

  private filenameFromUrl(input: string): string {
    try {
      const pathname = /^https?:\/\//i.test(input)
        ? new URL(input).pathname
        : input;
      return decodeURIComponent(
        pathname.split("/").filter(Boolean).pop() || ""
      );
    } catch {
      return input.split("/").filter(Boolean).pop() || "";
    }
  }

  private detectMime(buffer: Buffer): string | undefined {
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return "image/png";
    }
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return "image/jpeg";
    }
    if (
      buffer.length >= 6 &&
      /^GIF8[79]a$/.test(buffer.subarray(0, 6).toString("ascii"))
    ) {
      return "image/gif";
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp";
    }
    return undefined;
  }
}
