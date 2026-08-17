import {
  UseGuards,
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ProjectsService } from "./projects.service";
import { FormDataRequest } from "nestjs-form-data/dist/decorators";
import { CreateProjectDto } from "./dto/create-project.dto";
import {
  RolesDto,
  UpdateProjectByUserDto,
  UpdateProjectDto,
} from "./dto/update-project.dto";
import { ParamsProjectDto } from "./dto/params-project.dto";
import { QueryProjectDto } from "./dto/query-project.dto";

import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Limits } from "src/limits/limit.decorator";
import { LimitGuard } from "src/limits/limit.guard";

import commentDto from "src/comments/dto/comment.dto";
import mongoose from "mongoose";
import { ParticipantsKeys } from "./dto/participants-project.dto";
import { Project } from "./project.model";

@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) { }

  @Get(":type")
  getProjects(
    @Param() params: ParamsProjectDto,
    @Query() query: QueryProjectDto
  ): Promise<{ projects: Array<Project>; total: number }> {
    const projectStatus: string = "active";
   
    return this.projectsService.getProjects(params.type, projectStatus, query);
  }

  @Get("all/active")
  getAllActiveProjects(@Query() query: QueryProjectDto): Promise<{ projects: Array<Project>; total: number }> {
    const projectStatus: string = "active";

    return this.projectsService.getProjects("all", projectStatus, query);
  }

  @Roles("user")
  @UseGuards(JwtAuthGuard)
  @Get("all/user")
  getAllUserProjects(@Req() req: Request): Promise<Array<any>> {
    const id: string = req.user._id;

    return this.projectsService.getUserProjects(id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get(`invest/user`)
  getUserInvestedProject(@Req() req: Request): Promise<Array<Project>> {
    const id: string = req.user._id;

    return this.projectsService.getUserInvestProjects(id);
  }

  @Roles("moderator")
  @UseGuards(JwtAuthGuard)
  @Get("moderator/:type")
  getModeratorProjects(
    @Param() params: ParamsProjectDto
  ): Promise<{ projects: Array<Project>; total: number }> {
    const projectStatus: string = "all";
    const projectType: string = params.type;

    return this.projectsService.getProjects(projectType, projectStatus, {});
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/:type")
  getAdminProjects(
    @Param() params: ParamsProjectDto
  ): Promise<{ projects: Array<Project>; total: number }> {
    const projectStatus: string = "all";
    const projectType: string = params.type;

    return this.projectsService.getProjects(projectType, projectStatus, {});
  }

  @Get("data/:id")
  async getProject(
    @Param("id") id: string,
  ): Promise<any> {
    return this.projectsService.getProject(id);
  }

  @Roles("user")
  @Limits("projectLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Post("user")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createProjectByUser(@Req() req: Request) {
    const createProjectDto: CreateProjectDto = req.body;
    const initiator: string = req.user._id;

    return this.projectsService.createProject(
      { ...createProjectDto, projectStatus: "moderator" },
      initiator,
      "moderator"
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createProjectByAdmin(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.createProject({
      ...createProjectDto,
      projectStatus: "active",
    });
  }

  @Roles("moderator")
  @UseGuards(JwtAuthGuard)
  @Post("moderator")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createProjectByModerator(@Req() req: Request) {
    const createProjectDto: CreateProjectDto = req.body;
    const initiator: string = req.user._id;

    return this.projectsService.createProject(
      { ...createProjectDto, projectStatus: "admin" },
      initiator,
      "admin"
    );
  }

  @Roles("user")
  @Limits("projectLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Put("user/:id")
  @FormDataRequest()
  updateProjectByUser(
    @Req() req: Request,
    @Body() updateProjectDto: UpdateProjectByUserDto,
    @Param("id") id: string
  ) {
    const initiator: string = req.user._id;

    return this.projectsService.editProjectByUser(
      id,
      updateProjectDto,
      initiator
    );
  }

  @Roles("user")
  @Limits("projectLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Put("participants/:key/:id")
  updateByProject(
    @Req() req: Request,
    @Body() participants: Array<string>,
    @Param("key") key: ParticipantsKeys,
    @Param("id") id: string
  ) {
    const initiator: string = req.user._id;
    const rolesData: RolesDto = {
      isAdmin: req.user.role.includes("admin"),
      isModerator: req.user.role.includes("moderator"),
      isUser: req.user.role.includes("user"),
    };
    return this.projectsService.updateProjectParticipants(
      id,
      key,
      participants,
      rolesData,
      initiator
    );
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @FormDataRequest()
  updateProject(
    @Req() req: Request,
    @Body() updateProjectDto: UpdateProjectDto,
    @Param("id") id: string
  ) {
    const initiator: string = req.user._id;
    const rolesData: RolesDto = {
      isAdmin: req.user.role.includes("admin"),
      isModerator: req.user.role.includes("moderator"),
      isUser: req.user.role.includes("user"),
    };
    return this.projectsService.editProject(
      id,
      updateProjectDto,
      rolesData,
      initiator
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("comment/:id")
  addComment(@Req() req: Request) {
    const projectId: string = req.params.id;
    const comment: commentDto = req.body;
    const userId: string = req.user._id;

    return this.projectsService.addComment(projectId, {
      ...comment,
      author: new mongoose.Types.ObjectId(userId),
    });
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete("comment/:id/:comment")
  removeComment(@Param() params) {
    const { id, comment } = params;
    return this.projectsService.removeComment(id, comment);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  removeProject(@Param() params) {
    const { id } = params;
    return this.projectsService.removeProject(id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Put("end/:id/:refund")
  endProject(@Param() params) {
    const { id, refund } = params;
    const isRefund = refund === "1";

    return this.projectsService.endProject(id, isRefund);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Put("claim/:id")
  startClaim(@Param() params, @Query("ticker") ticker: string) {
    const { id } = params;

    return this.projectsService.startClaim(id, ticker);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  changeRedStatus(@Param() params) {
    const { id } = params;
    return this.projectsService.toggleRedStatus(id);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch(":status/:id")
  changeStatus(@Param() params) {
    const { id, status }: { id: string; status: string } = params;
    return this.projectsService.changeStatus(id, status);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/like/:id")
  async likeProject(@Req() req: Request, @Param("id") prId: string) {
    const userId: string = req.user._id;

    return this.projectsService.addLike(prId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/dislike/:id")
  async dislikeProject(@Req() req: Request, @Param("id") prId: string) {
    const userId: string = req.user._id;

    return this.projectsService.addDislike(prId, userId);
  }


  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("section/update/:id")
  async updateProjectSections(@Param("id") prId: string) {

    return this.projectsService.toggleSection(prId, 'funding-feed');
  }
}
