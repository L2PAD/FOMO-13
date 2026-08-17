import { Controller, Get, Post, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { InfoMarketService } from "../info-market.service";

@Controller("info")
export class InfoMarketController {
  constructor(private readonly market: InfoMarketService) {}

  @Get("crypto-prices")
  prices() {
    return this.market.getPrices();
  }

  @Get("crypto-market-data")
  marketData() {
    return this.market.getMarketData();
  }
}

@Controller("info/admin/crypto-market-data")
@UseGuards(JwtAuthGuard)
@Roles("admin", "moderator")
export class InfoAdminMarketController {
  constructor(private readonly market: InfoMarketService) {}

  @Post("refresh")
  refresh() {
    return this.market.refresh();
  }
}
