import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { InfoRepositoryService } from "../info-repository.service";

@Controller("info/admin/roadmap/tasks")
@UseGuards(JwtAuthGuard)
@Roles("admin", "moderator")
export class InfoRoadmapAdminController {
  constructor(private readonly repository: InfoRepositoryService) {}

  @Get()
  async list() {
    const roadmap = await this.repository.readSingleton("roadmap");
    return Array.isArray(roadmap.tasks) ? roadmap.tasks : [];
  }

  @Post("reorder")
  reorder(@Body() body: Array<Record<string, unknown>>) {
    return this.repository.reorderRoadmapTasks(body);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.repository.addRoadmapTask(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.repository.updateRoadmapTask(id, body);
  }

  @Delete(":id")
  @Roles("admin")
  delete(@Param("id") id: string) {
    return this.repository.deleteRoadmapTask(id);
  }
}
