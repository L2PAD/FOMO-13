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
  UseGuards,
} from "@nestjs/common";
import { FormDataRequest, MemoryStoredFile } from "nestjs-form-data";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  FomoV2LaunchpadConfirmCreateDto,
  FomoV2LaunchpadConfirmCreateCancellationDto,
  FomoV2LaunchpadCreateDraftDto,
  FomoV2LaunchpadCreateOperationDto,
  FomoV2LaunchpadPatchDraftDto,
  FomoV2LaunchpadPoolQueryDto,
  FomoV2LaunchpadProjectQueryDto,
  FomoV2LaunchpadPublicationDto,
  FomoV2LaunchpadPatchDetailsDto,
  FomoV2LaunchpadDeleteMediaDto,
} from "../dto";
import { FomoV2LaunchpadAdminService } from "../services";

@Controller("admin/fomo-v2/launchpad")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class FomoV2LaunchpadAdminController {
  constructor(
    private readonly launchpadAdminService: FomoV2LaunchpadAdminService
  ) {}

  @Get("config")
  getConfig() {
    return this.launchpadAdminService.getConfig();
  }

  @Get("projects")
  listProjects(@Query() query: FomoV2LaunchpadProjectQueryDto) {
    return this.launchpadAdminService.listProjects(query);
  }

  @Get("pools")
  listPools(@Query() query: FomoV2LaunchpadPoolQueryDto) {
    return this.launchpadAdminService.listPools(query);
  }

  @Get("pools/:id")
  getPool(@Param("id") id: string) {
    return this.launchpadAdminService.getPool(id);
  }

  @Get("pools/:id/readiness")
  getPublicationReadiness(@Param("id") id: string) {
    return this.launchpadAdminService.getPublicationReadiness(id);
  }

  @Post("pools/drafts")
  createDraft(
    @Body() body: FomoV2LaunchpadCreateDraftDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.createDraft(body, request.user);
  }

  @Patch("pools/:id")
  patchDraft(
    @Param("id") id: string,
    @Body() body: FomoV2LaunchpadPatchDraftDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.patchDraft(id, body, request.user);
  }

  @Patch("pools/:id/details")
  patchDetails(
    @Param("id") id: string,
    @Body() body: FomoV2LaunchpadPatchDetailsDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.patchDetails(id, body, request.user);
  }

  @Post("pools/:id/sync-contract")
  syncContract(@Param("id") id: string) {
    return this.launchpadAdminService.syncContract(id);
  }

  @Post("media")
  @FormDataRequest()
  uploadMedia(@Body("file") file: MemoryStoredFile) {
    return this.launchpadAdminService.uploadMedia(file);
  }

  @Delete("media")
  deleteMedia(@Body() body: FomoV2LaunchpadDeleteMediaDto) {
    return this.launchpadAdminService.deleteMedia(body.key);
  }

  @Post("pools/:id/confirm-create")
  confirmCreate(
    @Param("id") id: string,
    @Body() body: FomoV2LaunchpadConfirmCreateDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.confirmCreate(id, body, request.user);
  }

  @Post("pools/:id/reconcile-create")
  reconcileCreate(@Param("id") id: string, @Req() request: Request) {
    return this.launchpadAdminService.reconcileCreate(id, request.user);
  }

  @Post("pools/:id/confirm-create-cancellation")
  confirmCreateCancellation(
    @Param("id") id: string,
    @Body() body: FomoV2LaunchpadConfirmCreateCancellationDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.confirmCreateCancellation(
      id,
      body,
      request.user
    );
  }

  @Post("pools/:id/reset-reverted-create")
  resetRevertedCreate(@Param("id") id: string, @Req() request: Request) {
    return this.launchpadAdminService.resetRevertedCreate(id, request.user);
  }

  @Post("pools/:id/operations")
  createOperation(
    @Param("id") id: string,
    @Body() body: FomoV2LaunchpadCreateOperationDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.createOperation(id, body, request.user);
  }

  @Post("operations")
  createGlobalOperation(
    @Body() body: FomoV2LaunchpadCreateOperationDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.createGlobalOperation(body, request.user);
  }

  @Post("operations/:id/reconcile")
  reconcileOperation(@Param("id") id: string) {
    return this.launchpadAdminService.reconcileOperation(id);
  }

  @Patch("pools/:id/publication")
  updatePublication(
    @Param("id") id: string,
    @Body() body: FomoV2LaunchpadPublicationDto,
    @Req() request: Request
  ) {
    return this.launchpadAdminService.updatePublication(id, body, request.user);
  }
}
