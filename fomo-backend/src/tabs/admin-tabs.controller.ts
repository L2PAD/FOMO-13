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
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  CreateAdminTabDto,
  ReorderAdminTabsDto,
  UpdateAdminTabDto,
} from "./dto/tab.dto";
import { TabsService } from "./tabs.service";

@Controller("admin/tabs")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class AdminTabsController {
  constructor(private readonly tabsService: TabsService) {}

  @Get()
  findAll(@Query("search") search?: string) {
    return this.tabsService.findAdminTabs(search);
  }

  @Post()
  create(@Body() createAdminTabDto: CreateAdminTabDto, @Req() req: Request) {
    return this.tabsService.createAdminTab(createAdminTabDto, req.user._id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tabsService.findAdminTabById(id);
  }

  @Patch("reorder")
  reorder(@Body() reorderAdminTabsDto: ReorderAdminTabsDto, @Req() req: Request) {
    return this.tabsService.reorderAdminTabs(reorderAdminTabsDto, req.user._id);
  }

  @Patch(":id/toggle-active")
  toggleActive(@Param("id") id: string, @Req() req: Request) {
    return this.tabsService.toggleAdminTabActive(id, req.user._id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateAdminTabDto: UpdateAdminTabDto,
    @Req() req: Request
  ) {
    return this.tabsService.updateAdminTab(id, updateAdminTabDto, req.user._id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tabsService.removeAdminTab(id);
  }
}
