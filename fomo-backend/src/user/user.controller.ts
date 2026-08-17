import {
  Body,
  Param,
  Controller,
  Post,
  Get,
  Put,
  Res,
  Req,
  UseGuards,
  HttpCode,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import { HttpStatus } from "@nestjs/common/enums";
import { ConfigService } from "@nestjs/config";
import { HttpException } from "@nestjs/common/exceptions";
import { Response, Request } from "express";
import { FormDataRequest } from "nestjs-form-data/dist/decorators";
import { UserActivityStatsResponse, UserService } from "./user.service";
import { UserDto } from "./dto/user.dto";
import { Roles } from "src/auth/role.decorator";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { JwtWalletGuard } from "src/auth/jwt.wallet.guard";
import { RefreshAuthGuard } from "src/auth/refresh.auth.guard";
import { LimitGuard } from "src/limits/limit.guard";
import { Limits } from "src/limits/limit.decorator";

import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { InviteModeratorDto } from "./dto/invite-moderator.dto";
import { QueryUsersDto } from "./dto/query-users-dto";
import { ConnectTelegramDto } from "./dto/connect-telegram.dto";
import { QueryFomiesLeaderboardDto } from "./dto/query-fomies-leaderboard.dto";
import { QueryFomiesSearchDto } from "./dto/query-fomies-search.dto";
import { QueryFomiesShowdownDto } from "./dto/query-fomies-showdown.dto";

interface ITokens {
  id: string;
  accessToken: string;
  refreshToken: any;
  user: any;
}

@Controller("user")
export class UserController {
  private readonly maxAgeToken: number = 15 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) { }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("/")
  getUsers(@Query() query: { banned: string; active: string }) {
    return this.userService.getUsers(query);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/moderators")
  getModerators() {
    return this.userService.getModerators();
  }

  /* ── Admin › Settings › Administrators & Moderators (unified) ── */
  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/moderators")
  getModeratorsAdmin(@Query() query: { search?: string; role?: string }) {
    return this.userService.getModeratorsAdmin(query);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/moderators")
  createModeratorAdmin(@Body() body: any) {
    return this.userService.createModeratorByAdminUnified(body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/moderators/:id")
  getModeratorDetailAdmin(@Param("id") id: string) {
    return this.userService.getModeratorDetailAdmin(id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Patch("/admin/moderators/:id")
  updateModeratorAdmin(@Param("id") id: string, @Body() body: any) {
    return this.userService.updateModeratorByAdmin(id, body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("/admin/moderators/:id")
  deleteModeratorAdmin(@Param("id") id: string) {
    return this.userService.deleteModeratorByAdmin(id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/moderators/:id/tasks")
  addModeratorTask(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.userService.addModeratorTask(id, body, String(req.user?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Patch("/admin/moderators/:id/tasks/:taskId")
  updateModeratorTask(@Param("id") id: string, @Param("taskId") taskId: string, @Body() body: any) {
    return this.userService.updateModeratorTask(id, taskId, body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("/admin/moderators/:id/tasks/:taskId")
  deleteModeratorTask(@Param("id") id: string, @Param("taskId") taskId: string) {
    return this.userService.deleteModeratorTask(id, taskId);
  }

  @Get("/relations/:id/following")
  getPublicFollowing(
    @Param("id") id: string,
    @Query("offset") offset?: string,
    @Query("limit") limit?: string
  ) {
    return this.userService.getPublicFollowing(id, {
      offset,
      limit,
    });
  }

  @Get("/fomonauts/leaderboard")
  getFomiesLeaderboard(@Query() query: QueryFomiesLeaderboardDto) {
    return this.userService.getFomiesLeaderboard(query);
  }

  @Get("/fomonauts/search")
  getFomiesSearch(@Query() query: QueryFomiesSearchDto) {
    return this.userService.searchFomiesUsers(query);
  }

  @Get("/fomonauts/showdown")
  getFomiesShowdown(@Query() query: QueryFomiesShowdownDto) {
    return this.userService.getFomiesShowdown(query);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/activity-stats")
  getActivityStats(@Req() req: Request): Promise<UserActivityStatsResponse> {
    return this.userService.getUserActivityStats(String(req.user._id || ""));
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("/:id/admin-dossier")
  getUserAdminDossier(
    @Param("id") id: string,
    @Query() query: Record<string, string | undefined>
  ) {
    return this.userService.getUserAdminDossier(id, query);
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Get("/:id")
  getUser(@Param("id") id: string) {
    return this.userService.getUser(id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/board/active/:offset/:boardId")
  getActiveUsers(
    @Param("offset") offset: number,
    @Param("boardId") boardId: string,
    @Query("search") search?: string
  ) {
    return this.userService.getActiveUsers(offset, 20, boardId, search);
  }

  @Get("/fomonauts/all")
  getFomiesUsers(@Query() query: QueryUsersDto) {
    return this.userService.getFomiesList(query);
  }

  @Get("/fomonauts/statistics")
  getFomiesStatistics() {
    return this.userService.getFomiesStatistics();
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Put("/edit/:id")
  @FormDataRequest()
  updateUserByAdmin(@Req() req: Request, @Param("id") id: string, @Body() body) {
    const updateUserDto: UpdateUserDto = body;

    return this.userService.updateUserByAdmin(
      id,
      updateUserDto,
      String(req.user?._id || "")
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Put("/:id/:status")
  @FormDataRequest()
  updateUserStatus(@Req() req: Request, @Param() params: { id: string; status: string }) {
    const isBlocked: boolean = params.status !== "Active";

    return this.userService.updateUserStatus(
      params.id,
      isBlocked,
      String(req.user?._id || "")
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("/:id")
  deleteUser(@Param("id") id: string) {
    return this.userService.deleteUser(id);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Get("/initial/data")
  async getInitializeUser(@Req() req: Request) {
    const wallet: string = req.user.wallet;

    return this.userService.getInitializeUser(wallet);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("/spaceport/rewards/:badgeKey/claim")
  async claimSpaceportReward(@Req() req: Request, @Param("badgeKey") badgeKey: string) {
    return this.userService.claimSpaceportReward(String(req.user._id || ""), badgeKey);
  }

  // PUBLIC: SpacePort level ladder (Lv.1–Lv.5) + global XP rank config.
  // Backend-driven single source; used by the public website to render the
  // level requirements and "What You Unlock" privileges without hardcoding.
  @Get("/spaceport/levels-config")
  async getSpaceportLevelsConfig() {
    return this.userService.getSpaceportLevelsConfig();
  }

  @Post("/initial")
  async inititalUser(@Body() userDto: UserDto) {
    return this.userService.initializeUser(userDto);
  }

  @Post("/initial/login/:wallet")
  async loginByWallet(@Param("wallet") wallet: string) {
    return this.userService.loginByWallet(wallet);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Put("/initial")
  updateUser(@Req() req: Request) {
    const id: string = req.user._id;
    const updateData: UpdateUserDto = req.body;

    return this.userService.updateUser(id, updateData);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Put("/social/telegram/connect")
  connectTelegram(@Req() req: Request, @Body() body: ConnectTelegramDto) {
    const id: string = req.user._id;

    return this.userService.connectTelegram(id, body);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("/photo")
  @FormDataRequest()
  updatePhoto(@Req() req: Request) {
    const id: string = req.user._id;
    const img: File = req.body.img;

    return this.userService.updateUserPhoto(id, img);
  }

  // @UseGuards(JwtWalletGuard)
  // @Post("/login")
  // async login(
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @Body() userDto: UserDto
  // ) {
  //   const wallet: string = req.user.wallet;

  //   const { tokens, user, requires2FA } = await this.userService.login({
  //     ...userDto,
  //     wallet,
  //   });

  //   res.cookie("refreshTokenFomo", tokens.refreshToken, {
  //     httpOnly: true,
  //     maxAge: this.maxAgeToken,
  //     secure: false,
  //     sameSite: "none",
  //   });

  //   res
  //     .status(202)
  //     .json({ accessToken: tokens.accessToken, user, requires2FA });
  // }

  @Post("/admin/login")
  async loginToAdmin(@Body() userDto: UserDto, @Res() res: Response) {
    const { tokens, user } = await this.userService.loginToAdmin(userDto);

    res.cookie("refreshTokenFomo", tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.maxAgeToken,
      secure: false,
      sameSite: "none",
    });

    res.status(202).json({ accessToken: tokens.accessToken, user });
  }

  @UseGuards(JwtWalletGuard)
  @Post("/registration")
  @HttpCode(HttpStatus.CREATED)
  registration(@Req() req: Request) {
    const wallet: string = req.user.wallet;
    const userDto: UserDto = req.body;

    return this.userService.registrationByEmail(wallet, userDto);
  }

  @UseGuards(RefreshAuthGuard)
  @Post("/refresh")
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies.refreshTokenFomo;

    if (!token) {
      throw new HttpException("Auth error", HttpStatus.FORBIDDEN);
    }

    const tokens = await this.userService.refresh(token);

    res.cookie("refreshTokenFomo", tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.maxAgeToken,
      secure: false,
      sameSite: "none",
    });

    res.status(202).json({ accessToken: tokens.accessToken });
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/checkAdmin")
  async checkAdmin(@Req() req: Request, @Res() res: Response) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new HttpException("Auth error", HttpStatus.FORBIDDEN);
    }

    const tokens: ITokens = await this.userService.refreshByAccess(token);

    res.cookie("refreshTokenFomo", tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.maxAgeToken,
      secure: false,
      sameSite: "none",
    });

    res.status(202).json({
      accessToken: tokens.accessToken,
      id: tokens.id,
      user: tokens.user,
    });
  }

  @Roles("moderator")
  @UseGuards(JwtAuthGuard)
  @Post("/checkModerator")
  async checkModerator(@Req() req: Request, @Res() res: Response) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new HttpException("Auth error", HttpStatus.FORBIDDEN);
    }

    const tokens: ITokens = await this.userService.refreshByAccess(token);

    res.cookie("refreshTokenFomo", tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.maxAgeToken,
    });

    res.status(202).json({
      accessToken: tokens.accessToken,
      id: tokens.id,
      user: tokens.user,
    });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("/logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new HttpException("Auth error", HttpStatus.FORBIDDEN);
    }

    const result = await this.userService.logout(token);

    res.clearCookie("refreshTokenFomo");

    res.status(202).json({ success: result });
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/create")
  async createUser(@Body() body) {
    const userDto: UserDto = body;
    return this.userService.createUserByAdmin(userDto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("/new/password")
  async changePassword(@Req() req: Request, @Res() res: Response) {
    const token = req.headers.authorization?.split(" ")[1];

    const passwordsData: ChangePasswordDto = req.body;

    if (!token) {
      throw new HttpException("Auth error", HttpStatus.FORBIDDEN);
    }

    const { user } = await this.userService.changePassword(
      token,
      passwordsData
    );

    res.status(200).json({ user });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("/change/:email")
  async changeEmail(@Req() req: Request, @Res() res: Response) {
    const userId: string = req.user._id;
    const email: string = req.params.email;

    if (!userId) {
      throw new HttpException("Auth error", HttpStatus.FORBIDDEN);
    }

    const { user } = await this.userService.changeEmail(userId, email);

    res.status(200).json({ user });
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Patch("/verification/:userId/:action")
  async updateVerificationStatus(@Req() req: Request, @Res() res: Response) {
    const userId: string = req.params.userId;
    const action: "verification" | "removal-verification" | string =
      req.params.action;

    const message: string = await this.userService.updateVerificationStatus(
      userId,
      action,
      String(req.user?._id || "")
    );

    res.status(200).json({ success: true, message });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("/project/:action/:projectId")
  async addProjectToInvested(@Req() req: Request, @Res() res: Response) {
    const userId: string = req.user._id;
    const projectId: string = req.params.projectId;
    const action: any = req.params.action;

    if (!userId) {
      throw new HttpException("Auth error", HttpStatus.FORBIDDEN);
    }

    const user = await this.userService.addPoolProject(
      userId,
      projectId,
      action
    );

    res.status(200).json({ user });
  }

  @Get("/email/confirm-change")
  async confirmChangeEmail(@Req() req: Request, @Res() res: Response) {
    const newEmail: any = req.query.new;
    const oldEmail: any = req.query.old;
    const code: any = req.query.code;

    const isSuccess: boolean = await this.userService.confirmChange(
      newEmail,
      oldEmail,
      code
    );

    if (isSuccess) {
      return res.redirect(
        `${this.configService.get("FRONT_URL")}/gemslab/profile`
      );
    }

    res.redirect(
      `${this.configService.get("FRONT_URL")}/gemslab/profile?emailError=true`
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/reward")
  async changeUserPoints(@Body() body) {
    const users: Array<string> = body.users;

    const points: number = body.points;

    return this.userService.changePoints(users, points);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/moderator/invite")
  async inviteModerator(@Body() body: InviteModeratorDto) {
    return this.userService.inviteModeratorByAdmin(body);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/like/:id")
  async likeItem(@Req() req: Request, @Param("id") prId: string) {
    const userId: string = req.user._id;

    return this.userService.addLike(prId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/dislike/:id")
  async dislikeItem(@Req() req: Request, @Param("id") prId: string) {
    const userId: string = req.user._id;

    return this.userService.addDislike(prId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("follow/:id")
  async follow(@Req() req, @Param("id") id: string, @Body() body: any) {
    const followerId = req.user._id;
    return this.userService.followUser(followerId, id, body?.sourceTopicId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("block/:id")
  async blockUser(@Req() req, @Param("id") blockedUserId: string) {
    const userId = req.user._id;
    return this.userService.blockUser(userId, blockedUserId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete("block/:id")
  async unblockUser(@Req() req, @Param("id") blockedUserId: string) {
    const userId = req.user._id;
    return this.userService.unblockUser(userId, blockedUserId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("block/check/:id")
  async checkBlocked(@Req() req, @Param("id") targetUserId: string) {
    const userId = req.user._id;
    const isBlocked = await this.userService.isUserBlocked(userId, targetUserId);
    const isBlockedByThem = await this.userService.isUserBlocked(targetUserId, userId);
    return { isBlocked, isBlockedByThem };
  }
}
