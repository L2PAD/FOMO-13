import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { CreateSpaceportPurchaseDto } from './dto/create-spaceport-purchase.dto';
import { SpaceportPurchasesService } from './spaceport-purchases.service';

@Controller('spaceport-purchases')
export class SpaceportPurchasesController {
  constructor(
    private readonly spaceportPurchasesService: SpaceportPurchasesService,
  ) {}

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Body() createSpaceportPurchaseDto: CreateSpaceportPurchaseDto,
  ) {
    const userId = req.user._id;
    return this.spaceportPurchasesService.create(
      userId,
      createSpaceportPurchaseDto,
    );
  }
}
