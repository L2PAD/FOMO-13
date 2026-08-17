import { Request } from "express";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Param,
  Body,
  Req,
  Query,
} from "@nestjs/common";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { TaskTypes } from "./models/task.model";
import { TasksService } from "./tasks.service";
import { TaskDto } from "./dto/task.dto";
import { FormDataRequest } from "nestjs-form-data/dist/decorators";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN / CRM Task Center endpoints. Declared BEFORE the generic `/:type`
  // route so they are not captured by it.
  // ─────────────────────────────────────────────────────────────────────────
  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/overview")
  adminOverview(@Query("days") days?: string) {
    return this.tasksService.getAdminOverview(Number(days) || 30);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/analytics")
  adminAnalytics(@Query("days") days?: string) {
    return this.tasksService.getAdminAnalytics(Number(days) || 30);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/review-queue")
  adminReviewQueue() {
    return this.tasksService.getReviewQueue();
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/metrics-catalog")
  adminMetricsCatalog() {
    return this.tasksService.getMetricsCatalog();
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/list")
  adminList(@Query("group") group?: string, @Query("activityId") activityId?: string) {
    return this.tasksService.listAdminTasks(group === "global" ? "global" : "earlyland", activityId);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/user/:userId")
  adminUserTasks(@Param("userId") userId: string) {
    return this.tasksService.getUserTasks(userId);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/diagnostics")
  adminDiagnostics() {
    return this.tasksService.getDiagnostics();
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/earlyland-funnel")
  adminEarlyLandFunnel(@Query("days") days?: string) {
    return this.tasksService.getEarlyLandFunnel(Number(days) || 30);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/backfill")
  adminBackfill(@Body() body: { apply?: boolean }) {
    return this.tasksService.backfillLegacy(Boolean(body?.apply));
  }

  // Canonical presentation DTO for the public website (all interpretation
  // happens here; the frontend never reads internals). (P4)
  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("presentation/:type")
  getPresentation(@Req() req: Request, @Param("type") type: TaskTypes) {
    return this.tasksService.buildPresentation(type, String(req.user._id));
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Put("step/:taskId/:stepId")
  toggleStep(
    @Req() req: Request,
    @Param() params: { taskId: string; stepId: string },
    @Body() body: { done?: boolean },
  ) {
    return this.tasksService.toggleStep(params.taskId, String(req.user._id), params.stepId, body?.done !== false);
  }

  @Roles("any")
  // ── Personal Tasker (user) — views over one TaskUserProgress ──────────────
  @UseGuards(JwtAuthGuard)
  @Get("my/tasker")
  myTasker(@Req() req: Request) {
    return this.tasksService.getMyTasker(String((req.user as any)._id));
  }

  @UseGuards(JwtAuthGuard)
  @Post("my/add/:taskId")
  addToMyTasks(@Param("taskId") taskId: string, @Req() req: Request) {
    return this.tasksService.addToMyTasks(taskId, String((req.user as any)._id));
  }

  @UseGuards(JwtAuthGuard)
  @Post("my/start/:taskId")
  startMyTask(@Param("taskId") taskId: string, @Req() req: Request) {
    return this.tasksService.startMyTask(taskId, String((req.user as any)._id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete("my/:taskId")
  removeFromMyTasks(@Param("taskId") taskId: string, @Req() req: Request) {
    return this.tasksService.removeFromMyTasks(taskId, String((req.user as any)._id));
  }

  @UseGuards(JwtAuthGuard)
  @Get("my/activity/:activityId")
  activityTasks(@Param("activityId") activityId: string, @Req() req: Request) {
    return this.tasksService.buildActivityTasks(activityId, String((req.user as any)._id));
  }

  // Unified single-task presentation for the public Task Detail drawer (P1).
  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("detail/:taskId")
  taskDetail(@Param("taskId") taskId: string, @Req() req: Request) {
    return this.tasksService.buildTaskDetail(taskId, String((req.user as any)?._id || ""));
  }

  @UseGuards(JwtAuthGuard)
  @Get("/:type")
  getTasks(
    @Req() req: Request,
    @Param("type") tasksType: TaskTypes,
    @Query() query: any,
  ) {
    return this.tasksService.getTasks(tasksType, query, req.user);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("item/:id")
  getTaskItem(@Param("id") id: string) {
    return this.tasksService.getTaskItem(id);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Post()
  createTask(@Body() body: TaskDto) {
    return this.tasksService.createTask(body);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post('claim/:taskId')
  claimTask(
    @Req() req : Request,
    @Param('taskId') taskId : string
  ) {
    const userId : string = req.user._id;
    return this.tasksService.claimTask(taskId, userId);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Put("/:id")
  updateTask(@Param("id") id: string, @Body() body: TaskDto) {
    return this.tasksService.updateTask(id, body);
  }

  @Roles("user")
  @UseGuards(JwtAuthGuard)
  @Put("request/new/:taskId")
  confirmTaskByUser(@Req() req: Request, @Body() body: any) {
    const userId: string = req.user._id;
    const taskId: string = req.params.taskId;
    return this.tasksService.confirmTaskByUser(taskId, userId, body?.evidence ?? body);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Put("request/confirm/:userId/:taskId/:points")
  confirmUserRequest(
    @Req() req: Request,
    @Param() params: { userId: string; taskId: string; points: string }
  ) {
    const reviewerId = String((req.user as any)?._id || "");
    return this.tasksService.confirmRequest(
      params.taskId,
      params.userId,
      Number(params.points),
      reviewerId,
    );
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Put("request/reject/:userId/:taskId/:points")
  rejectUserRequest(
    @Param() params: { userId: string; taskId: string; points: string },
    @Body() body: { reason?: string; note?: string },
  ) {
    return this.tasksService.rejectRequest(params.taskId, params.userId, body?.reason, body?.note);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Put("request/clarify/:userId/:taskId")
  clarifyUserRequest(
    @Param() params: { userId: string; taskId: string },
    @Body() body: { message?: string; note?: string },
  ) {
    return this.tasksService.requestClarification(params.taskId, params.userId, body?.message || "", body?.note || "");
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Put(":id/archive")
  archiveTask(@Param("id") id: string) {
    return this.tasksService.archiveTask(id);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Put(":id/unarchive")
  unarchiveTask(@Param("id") id: string) {
    return this.tasksService.unarchiveTask(id);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Delete("/:id")
  deleteTask(@Param("id") id: string) {
    return this.tasksService.deleteTask(id);
  }
}
