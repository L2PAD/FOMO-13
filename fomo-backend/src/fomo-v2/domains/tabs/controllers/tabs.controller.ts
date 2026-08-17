import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { CreateTabDto, UpdateTabDto } from "src/tabs/dto/tab.dto";
import { FomoV2TabsService } from "../services/tabs.service";

@Controller("fomo-v2/tabs")
export class FomoV2TabsController {
  constructor(
    private readonly tabsService: FomoV2TabsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private getOptionalUserId(req: Request): string | undefined {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return undefined;

      const payload: any = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET_ACCESS"),
      });

      return payload?._id;
    } catch (error) {
      return undefined;
    }
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTabDto: CreateTabDto, @Req() req) {
    return this.tabsService.create(createTabDto, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateTabDto: UpdateTabDto,
    @Req() req: Request
  ) {
    return this.tabsService.update(id, req.user._id, updateTabDto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  patch(
    @Param("id") id: string,
    @Body() updateTabDto: UpdateTabDto,
    @Req() req: Request
  ) {
    return this.tabsService.update(id, req.user._id, updateTabDto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req) {
    return this.tabsService.remove(id, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("save/:id")
  saveTabLegacyPath(@Param("id") id: string, @Req() req) {
    return this.tabsService.saveTab(id, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":id/save")
  saveTab(@Param("id") id: string, @Req() req) {
    return this.tabsService.saveTab(id, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("pin/:id")
  pinTabLegacyPath(@Param("id") id: string, @Req() req) {
    return this.tabsService.pinTab(id, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":id/pin")
  pinTab(@Param("id") id: string, @Req() req) {
    return this.tabsService.pinTab(id, req.user._id);
  }

  @Get("global")
  findGlobalTabs() {
    return this.tabsService.findGlobalTabs();
  }

  @Get("home")
  findHomeTabs() {
    return this.tabsService.findHomeTabs();
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("all/:type")
  findSaved(
    @Req() req,
    @Param("type") type: "saved" | "explore tabs",
    @Query("search") search: string,
    @Query("subtype") subtype?: "new" | "trending tabs",
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.tabsService.findSaved({
      search: search?.trim(),
      page: Number(page),
      limit: Number(limit),
      userId: req.user._id,
      type,
      subType: subtype,
    });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("user/created")
  findUserTabs(
    @Req() req: Request,
    @Query("search") search: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.tabsService.findCreated({
      search: search?.trim(),
      page: Number(page),
      limit: Number(limit),
      userId: req.user._id || "",
    });
  }

  @Get("user/public")
  findTabsByUserId(
    @Req() req: Request,
    @Query("search") search: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("userId") userId: string
  ) {
    return this.tabsService.findPublicByUser({
      search: search?.trim(),
      page: Number(page),
      limit: Number(limit),
      userId: this.getOptionalUserId(req),
      creatorId: userId,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Query() query: any, @Req() req: Request) {
    return this.tabsService.getProjectsByTabs(
      id,
      query,
      this.getOptionalUserId(req)
    );
  }
}
