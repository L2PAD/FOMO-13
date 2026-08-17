import { UpdateNewsDto } from "./dto/update-news.dto";
import {
  UseGuards,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Query,
} from "@nestjs/common";
import { NewsService } from "./news.service";
import { FormDataRequest } from "nestjs-form-data/dist/decorators";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { CreateNewsDto } from "./dto/create-news.dto";
import { Response, Request } from "express";
import { LimitGuard } from "src/limits/limit.guard";
import { Limits } from "src/limits/limit.decorator";
import { News } from "./models/news.model";
import { JwtWalletGuard } from "src/auth/jwt.wallet.guard";
import { QueryNewsDto } from "./dto/query-news.dto";

@Controller("news")
export class NewsController {
  constructor(private readonly newsService: NewsService) { }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("all/:page")
  getAllNews(@Param("page") page: string): Promise<Array<News>> {
    return this.newsService.getAllNews(page);
  }

  @Get("item/:id")
  getNewsItem(@Param("id") id: string): Promise<News> {
    return this.newsService.getNewsItem(id);
  }

  @Get("/:page")
  getActiveNews(
    @Param("page") page: string,
    @Query() query: QueryNewsDto
  ): Promise<{ total: number; news: Array<News> }> {
    const parsedLimit = query.limit ?? 10;
    const parsedOffset = query.offset ?? 0;

    return this.newsService.getNews(page, parsedLimit, parsedOffset, "", query);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("all/user/content/:id")
  getUserNews(@Param("id") id: string): Promise<{ total: number; news: Array<News> }> {
    return this.newsService.getNews("all", 10, 0, id);
  }

  @Get("fomo/latest")
  getUpdates(): Promise<Array<{ _id: string; page: string, date: Date, title: string }>> {
    return this.newsService.getFomoUpdates();
  }

  @Roles("user")
  @Limits("newsLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Post("/create")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createNews(@Req() req: Request) {
    const id: string = req.user._id;
    const createNewsDto: CreateNewsDto = req.body;

    return this.newsService.createNews(
      { ...createNewsDto, status: "moderator", isUserCreator: true, },
      id
    );
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/create/admin")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createNewsByAdmin(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.createNews({ ...createNewsDto, status: "active" });
  }

  @Roles("moderator")
  @UseGuards(JwtAuthGuard)
  @Post("/create/moderator")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createNewsByModerator(@Req() req: Request) {
    const initiator: string = req.user._id;
    const createNewsDto: CreateNewsDto = req.body;

    return this.newsService.createNewsByModerator(
      { ...createNewsDto, status: "admin" },
      initiator
    );
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @FormDataRequest()
  @HttpCode(HttpStatus.OK)
  async updateNews(
    @Body() updateNewsDto: UpdateNewsDto,
    @Param("id") id: string,
    @Res() response: Response
  ) {
    await this.newsService.updateNews(id, updateNewsDto);
    response.send("News was updated");
  }

  @Roles("moderator,admin")
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteNews(@Param("id") id: string, @Res() response: Response) {
    await this.newsService.deleteNews(id);

    response.send("News was deleted");
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("like/:id")
  async likeNews(@Req() req: Request, @Param("id") newsId: string) {
    const userId: string = req.user._id;

    return this.newsService.addLike(newsId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("dislike/:id")
  async dislikeNews(@Req() req: Request, @Param("id") newsId: string) {
    const userId: string = req.user._id;

    return this.newsService.addDislike(newsId, userId);
  }

  @UseGuards(JwtWalletGuard)
  @Post(":id/view")
  addView(@Param("id") newsId: string,@Req() req : Request) {
    const userWallet : string = req.user.wallet 

    return this.newsService.addView(newsId, userWallet);
  }

}
