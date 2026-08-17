import { BadRequestException, Injectable, Optional } from "@nestjs/common";
import * as fs from "fs";
import { AssetStorageService } from "src/storage/asset-storage.service";

export interface UploadedMigrationFile {
  originalname: string;
  buffer: Buffer;
}

@Injectable()
export class FilesService {
  private readonly assetStorage: AssetStorageService;

  constructor(@Optional() assetStorage?: AssetStorageService) {
    this.assetStorage = assetStorage || new AssetStorageService();
  }

  private getFileBuffer(file: any): Buffer {
    if (Buffer.isBuffer(file?.buffer)) {
      return file.buffer;
    }

    if (file?.buffer instanceof Uint8Array) {
      return Buffer.from(file.buffer);
    }

    if (file?.filepath) {
      return fs.readFileSync(file.filepath);
    }

    throw new Error("Unsupported file payload");
  }

  private getOriginalFileName(file: any, fallbackName = "file.bin"): string {
    return (
      file?.originalFilename ||
      file?.originalName ||
      file?.originalname ||
      file?.name ||
      fallbackName
    );
  }

  private getMimeType(file: any): string | undefined {
    return file?.mimetype || file?.mimeType || file?.type;
  }

  writeFiles = async (files, data) => {
    const { investors, team, partners } = data;

    for (const key in files) {
      const currentFile = Array.isArray(files[key]) ? files[key][0] : files[key];
      const fileName = await this.writeFile(currentFile);

      if (key.includes("description")) {
        data.projectImg = fileName;
      }

      if (key.includes("logo")) {
        data.img = fileName;
      }

      if (key.includes("investor")) {
        const index = key.split("Img")[1];
        investors[index].img = fileName;
      }

      if (key.includes("team")) {
        const index = key.split("Img")[1];
        team[index].img = fileName;
      }

      if (key.includes("partner")) {
        const index = key.split("Img")[1];
        partners[index].img = fileName;
      }
    }

    return {
      investors,
      team,
      partners,
      projectImg: data.projectImg,
      img: data.img,
    };
  };

  writeFile = async (file: any): Promise<string> => {
    if (!file) return "";

    const storedAsset = await this.assetStorage.writeFile({
      buffer: this.getFileBuffer(file),
      originalName: this.getOriginalFileName(file, "file.bin"),
      mimeType: this.getMimeType(file),
    });

    return storedAsset.url;
  };

  async writeBase64File(fileData?: string): Promise<string> {
    if (!fileData) return "";

    const matches = fileData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    const mimeType = matches?.[1] || "image/jpeg";
    const base64Data = matches?.[2] || fileData;
    const extension = mimeType.split("/")[1]?.split("+")[0] || "jpg";
    const buffer = Buffer.from(base64Data, "base64");
    const storedAsset = await this.assetStorage.writeFile({
      buffer,
      originalName: `image.${extension}`,
      mimeType,
    });

    return storedAsset.url;
  }

  writeFileWithOriginalName(file: UploadedMigrationFile): string {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    const storedAsset = this.assetStorage.writeLocalFileWithOriginalName({
      buffer: this.getFileBuffer(file),
      originalName: file.originalname,
    });

    return storedAsset.url;
  }

  removeFile = async (img: string): Promise<{ success: boolean }> => {
    if (!img) {
      return { success: true };
    }

    try {
      await this.assetStorage.removeFile(img);

      return { success: true };
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        return { success: true };
      }

      return { success: false };
    }
  };

  writeFileAndDelete = async (file: any, fileToDelete: string): Promise<string> => {
    const uploadedFilePath = await this.writeFile(file);
    await this.removeFile(fileToDelete);

    return uploadedFilePath;
  };

  removeFiles = async (files: Array<{ img: string }>): Promise<{ success: boolean }> => {
    let isSuccess = true;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].img) {
        continue;
      }

      const result = await this.removeFile(files[i].img);
      if (!result.success) {
        isSuccess = false;
      }
    }

    return { success: isSuccess };
  };
}
