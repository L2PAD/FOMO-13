import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Roles } from "../auth/role.decorator";
import { JwtAuthGuard } from "../auth/jwt.auth.guard";
import { AdminAiChatService } from "./admin-ai-chat.service";
import { AdminAiExportService } from "./admin-ai-export.service";
import { AdminAiAccessMode } from "./fomo-v2-context/fomo-v2-ai-types";

@Controller("admin-ai-chat")
export class AdminAiChatController {
  constructor(
    private readonly adminAiChatService: AdminAiChatService,
    private readonly adminAiExportService: AdminAiExportService
  ) {}

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("models")
  getModels() {
    return this.adminAiChatService.getModels();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("folders")
  getFolders(@Req() req: Request) {
    return this.adminAiChatService.getFolders(String(req.user?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("folders")
  createFolder(@Req() req: Request, @Body() body: { name?: string }) {
    return this.adminAiChatService.createFolder(String(req.user?._id || ""), body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Patch("folders/:folderId")
  updateFolder(
    @Req() req: Request,
    @Param("folderId") folderId: string,
    @Body() body: { name?: string }
  ) {
    return this.adminAiChatService.updateFolder(
      String(req.user?._id || ""),
      folderId,
      body
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("folders/:folderId")
  deleteFolder(@Req() req: Request, @Param("folderId") folderId: string) {
    return this.adminAiChatService.deleteFolder(String(req.user?._id || ""), folderId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("threads")
  getThreads(@Req() req: Request) {
    return this.adminAiChatService.getThreads(String(req.user?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("threads")
  createThread(
    @Req() req: Request,
    @Body() body: { title?: string; folderId?: string | null }
  ) {
    return this.adminAiChatService.createThread(String(req.user?._id || ""), body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Patch("threads/:threadId")
  updateThread(
    @Req() req: Request,
    @Param("threadId") threadId: string,
    @Body() body: { title?: string; folderId?: string | null; isPinned?: boolean }
  ) {
    return this.adminAiChatService.updateThread(
      String(req.user?._id || ""),
      threadId,
      body
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("threads/:threadId")
  deleteThread(@Req() req: Request, @Param("threadId") threadId: string) {
    return this.adminAiChatService.deleteThread(String(req.user?._id || ""), threadId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("threads/:threadId/messages")
  getMessages(@Req() req: Request, @Param("threadId") threadId: string) {
    return this.adminAiChatService.getMessages(String(req.user?._id || ""), threadId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("tool-runs/:id/approve")
  approveToolRun(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { editedPayload?: unknown; adminNote?: string }
  ) {
    return this.adminAiChatService.approveToolRun(
      String(req.user?._id || ""),
      id,
      body || {}
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("tool-runs/:id/reject")
  rejectToolRun(@Req() req: Request, @Param("id") id: string) {
    return this.adminAiChatService.rejectToolRun(String(req.user?._id || ""), id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("threads/:threadId/messages/:messageId/tool-runs")
  getMessageToolRuns(
    @Req() req: Request,
    @Param("threadId") threadId: string,
    @Param("messageId") messageId: string
  ) {
    return this.adminAiChatService.getToolRuns(
      String(req.user?._id || ""),
      threadId,
      messageId
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("artifacts/:id")
  getArtifact(@Req() req: Request, @Param("id") id: string) {
    return this.adminAiExportService.getArtifactForAdmin(
      String(req.user?._id || ""),
      id
    );
  }

  @Get("artifacts/:id/download")
  async downloadArtifact(
    @Param("id") id: string,
    @Query("expires") expires: string,
    @Query("signature") signature: string,
    @Res() res: Response
  ) {
    const download = await this.adminAiExportService.getDownload(
      id,
      expires,
      signature
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(download.artifact.filename).replace(/["\r\n]/g, "")}"`
    );
    res.setHeader(
      "Content-Type",
      download.artifact.contentType || "application/octet-stream"
    );
    if (download.artifact.bytes) {
      res.setHeader("Content-Length", String(download.artifact.bytes));
    }
    res.setHeader("Cache-Control", "private, no-store");
    download.stream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
      else res.destroy();
    });
    download.stream.pipe(res);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("threads/:threadId/messages")
  sendMessage(
    @Req() req: Request,
    @Param("threadId") threadId: string,
    @Body() body: {
      message?: string;
      model?: string;
      modelPreset?: string;
      accessMode?: AdminAiAccessMode;
    }
  ) {
    return this.adminAiChatService.sendMessage(
      String(req.user?._id || ""),
      threadId,
      body
    );
  }
}
