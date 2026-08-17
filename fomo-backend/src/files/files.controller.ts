import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { FilesService, UploadedMigrationFile } from "./files.service";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // @Post("upload-migration")
  // @UseInterceptors(
  //   FileInterceptor("file", {
  //     storage: memoryStorage(),
  //     limits: {
  //       fileSize: 20 * 1024 * 1024,
  //     },
  //   })
  // )
  // uploadMigration(@UploadedFile() file?: UploadedMigrationFile) {
  //   if (!file) {
  //     throw new BadRequestException("File is required");
  //   }

  //   const path = this.filesService.writeFileWithOriginalName(file);

  //   return {
  //     success: true,
  //     path,
  //   };
  // }
}
