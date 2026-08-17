import {
  UseGuards,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Query,
  Patch,
  Put,
} from "@nestjs/common";
import { SocialParcingService } from "./social-pacing.service";
import { TwitterAccsParcingService } from "./twitter-accs-parcing.service";
import { FormDataRequest } from "nestjs-form-data/dist/decorators";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import {
  AddTwitterAccByUserDto,
  AddTwitterAccDto,
  QueryKeywordsDto,
  QueryParsingDto,
  UpdateTwitterAccByUserDto,
} from "./dto/add-twiiter-acc.dto";
import { Request, Response } from "express";

@Controller("socialparcing")
export class SocialParcingController {
  constructor(
    private readonly socialParcingService: SocialParcingService,
    private readonly twitterAccsParcingService: TwitterAccsParcingService
  ) { }

  @Get()
  getAllTweets(@Query() query: QueryParsingDto) {
    return this.twitterAccsParcingService.getUsers(query);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("user")
  getCustomUserTweets(@Req() req: Request, @Query() query: QueryParsingDto) {
    const userId: string = req.user._id;

    return this.twitterAccsParcingService.getPrivateTweets(userId, query);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post()
  addTwitterAccByAdmin(@Body() addTwitterAccDto: AddTwitterAccDto) {
    return this.socialParcingService.addTwitterAccByAdmin(addTwitterAccDto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("user")
  addTwitterAcc(
    @Req() req: Request,
    @Body() addTwitterAccDto: AddTwitterAccByUserDto
  ) {
    const userId: string = req.user._id;

    return this.socialParcingService.addTwitterAccByUser({
      ...addTwitterAccDto,
      userId,
    });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("user/keywords")
  addTwitterKeywords(
    @Req() req: Request,
    @Body() keywordsData: { keywords: string, isSentiment?: boolean }
  ) {
    const userId: string = req.user._id;

    return this.socialParcingService.addTwitterKeywords({
      userId,
      keywords: keywordsData.keywords,
      isSentiment: !!keywordsData.isSentiment,
      isPrivate: true
    });
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/keywords")
  addTwitterKeywordsByAdmin(
    @Req() req: Request,
    @Body() keywordsData: { keywords: string, isSentiment?: boolean }
  ) {
    const userId: string = req.user._id;

    return this.socialParcingService.addTwitterKeywords({
      userId,
      keywords: keywordsData.keywords,
      isSentiment: !!keywordsData.isSentiment,
      isPrivate: false
    });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Put("user")
  updateTwitterAcc(
    @Req() req: Request,
    @Body() twitterAccDto: UpdateTwitterAccByUserDto
  ) {
    const userId: string = req.user._id;

    return this.socialParcingService.updateTwitterAccByUser({
      ...twitterAccDto,
      userId,
    });
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteTwitterAcc(@Param("id") id: string, @Res() response: Response) {
    await this.socialParcingService.deleteTwitterPerson(true, id);
    response.send("Event was deleted");
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch(":id/keywords")
  @HttpCode(HttpStatus.OK)
  async updateTwitterPersonKeywords(
    @Param("id") id: string,
    @Body("keywords") keywords: string
  ) {
    return this.socialParcingService.updateKeywords(id, keywords);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete("person/:id")
  @HttpCode(HttpStatus.OK)
  async deleteTwitterPerson(@Req() req: Request, @Param("id") id: string) {
    const userId: string = req.user._id;

    return this.socialParcingService.deleteTwitterPerson(false, id, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/keywords/random")
  async getRandomKeywords() {
    return this.socialParcingService.getRandomKeywords();
  }


  @Get("/public/keywords/trending")
  async getPublicKeywords(@Query() query: QueryKeywordsDto) {

    return this.socialParcingService.getKeywords('', { ...query, isPrivate: false });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/private/keywords/trending")
  async getPrivateKeywords(@Req() req: Request, @Query() query: QueryKeywordsDto) {
    const userId: string = req.user._id;

    return this.socialParcingService.getKeywords(userId, { ...query, isPrivate: true });
  }


  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/list/short/keywords")
  async getKeywordShortList(@Req() req: Request, @Query() query: QueryKeywordsDto) {
    const userId: string = req.user._id;

    return this.socialParcingService.findAllByStringKeywords(userId, query.searchValue);
  }
}
