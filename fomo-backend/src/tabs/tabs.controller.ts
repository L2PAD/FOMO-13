import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Patch,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TabsService } from "./tabs.service";
import { CreateTabDto, UpdateTabDto } from "./dto/tab.dto";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Controller("tabs")
export class TabsController {
  constructor(
    private readonly tabsService: TabsService,
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
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req) {
    return this.tabsService.remove(id, req.user._id);
  }
  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("save/:id")
  saveTab(@Param("id") id: string, @Req() req) {
    return this.tabsService.saveTab(id, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("pin/:id")
  pinTab(@Param("id") id: string, @Req() req) {
    return this.tabsService.pinTab(id, req.user._id);
  }

  @Get()
  findAll(
    @Query("type") type: string,
    @Query("subtype") subtype: string,
    @Query("search") search: string,
    @Query("page") page = 1
  ) {
    return this.tabsService.findAll(type, subtype, search, +page);
  }

  @Get("global")
  findGlobalTabs() {
    return this.tabsService.findGlobalTabs();
  }

  @Get("home")
  findHomeTabs() {
    return this.tabsService.findHomeTabs();
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Query() query: any, @Req() req: Request) {
    return this.tabsService.getProjectsByTabs(
      id,
      query,
      this.getOptionalUserId(req)
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/all/:type")
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
  @Get("/user/created")
  findUserTabs(
    @Req() req: Request,
    @Query("search") search: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    const userId: string = req.user._id || "";

    return this.tabsService.findCreated({
      search: search?.trim(),
      page: Number(page),
      limit: Number(limit),
      userId: userId,
    });
  }

  @Get("/user/public")
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
}
