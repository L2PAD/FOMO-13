import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { TopicsService } from "./topics.service";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { Topic, TopicStatus } from "./models/topic.model";

@Controller()
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  // ---- public ----
  @Get("topics")
  listPublic() {
    return this.topicsService.listPublic();
  }

  // ---- admin / moderator ----
  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("admin/topics")
  listAdmin() {
    return this.topicsService.listAdmin();
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("admin/topics")
  create(@Body() dto: Partial<Topic>) {
    return this.topicsService.create(dto);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("admin/topics/:id")
  update(@Param("id") id: string, @Body() dto: Partial<Topic>) {
    return this.topicsService.update(id, dto);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("admin/topics/:id/status")
  setStatus(@Param("id") id: string, @Body() body: { status: TopicStatus }) {
    return this.topicsService.setStatus(id, body?.status);
  }
}
