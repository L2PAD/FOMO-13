import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { InfoAssetsService } from "../info-assets.service";

@Controller("info/admin/assets")
@UseGuards(JwtAuthGuard)
@Roles("admin", "moderator")
export class InfoAssetsController {
  constructor(private readonly assets: InfoAssetsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024,
      },
    })
  )
  upload(@UploadedFile() file: any, @Req() request: Request) {
    const forwardedProto = String(request.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim();
    const protocol = forwardedProto || request.protocol;
    const origin = request.get("host")
      ? `${protocol}://${request.get("host")}`
      : undefined;
    return this.assets.upload(file, origin);
  }
}
