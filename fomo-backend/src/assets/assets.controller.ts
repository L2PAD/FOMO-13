import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { CreateAssetDto, UpdateAssetDto } from "./dto/create-asset.dto";
import { Asset } from "./models/asset.model";
import {
  AssetsService,
  PortfolioAssetSearchResult,
} from "./assets.service";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Request } from "express";

@Controller("assets")
export class AssetsController {
  constructor(
    private readonly assetService: AssetsService,
  ) {}

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req : Request,@Body() createAssetDto: CreateAssetDto): Promise<Asset> {
    const creator : string = req.user._id 
    
    return this.assetService.create({...createAssetDto,creator});
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('searchValue') searchValue?: string,
  ): Promise<PortfolioAssetSearchResult[]> {
    return this.assetService.findAllPaginated(Number(page), Number(limit),searchValue);
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Asset> {
    return this.assetService.findOne(id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateAssetDto: UpdateAssetDto
  ): Promise<Asset> {
    return this.assetService.update(id, updateAssetDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<void> {
    return this.assetService.remove(id);
  }
}
