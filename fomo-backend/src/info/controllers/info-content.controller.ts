import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { InfoContentService } from "../info-content.service";
import { InfoRepositoryService } from "../info-repository.service";

@Controller("info")
export class InfoPublicController {
  constructor(
    private readonly content: InfoContentService,
    private readonly repository: InfoRepositoryService
  ) {}

  @Get()
  bootstrap() {
    return this.content.getBootstrap();
  }

  @Get(":resource")
  resource(
    @Param("resource") resource: string,
    @Query() query: Record<string, unknown>
  ) {
    return this.repository.readResource(resource, { query });
  }

  @Get(":resource/:id")
  entity(@Param("resource") resource: string, @Param("id") id: string) {
    return this.repository.readEntity(resource, id);
  }
}

@Controller("info/admin")
@UseGuards(JwtAuthGuard)
@Roles("admin", "moderator")
export class InfoAdminContentController {
  constructor(private readonly repository: InfoRepositoryService) {}

  @Post(":resource/reorder")
  reorder(
    @Param("resource") resource: string,
    @Body() body: Array<Record<string, unknown>>
  ) {
    return this.repository.reorderEntities(resource, body);
  }

  @Post(":resource/seed-defaults")
  @Roles("admin")
  seedDefaults(@Param("resource") resource: string) {
    return this.repository.seedDefaults(resource);
  }

  @Get(":resource")
  resource(
    @Param("resource") resource: string,
    @Query() query: Record<string, unknown>
  ) {
    return this.repository.readResource(resource, { admin: true, query });
  }

  @Get(":resource/:id")
  entity(@Param("resource") resource: string, @Param("id") id: string) {
    return this.repository.readEntity(resource, id, true);
  }

  @Put(":resource")
  putSingleton(
    @Param("resource") resource: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.repository.putSingleton(resource, body);
  }

  @Post(":resource")
  create(
    @Param("resource") resource: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.repository.createEntity(resource, body);
  }

  @Put(":resource/:id")
  update(
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.repository.updateEntity(resource, id, body);
  }

  @Delete(":resource/:id")
  @Roles("admin")
  delete(@Param("resource") resource: string, @Param("id") id: string) {
    return this.repository.deleteEntity(resource, id);
  }
}
