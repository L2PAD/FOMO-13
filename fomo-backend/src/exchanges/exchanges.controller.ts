import { Controller, Get, Query } from "@nestjs/common";
import { ExchangesService } from "./exchanges.service";

@Controller("exchanges")
export class ExchangesController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Get()
  async getExchanges(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query("base") base?: string,
    @Query("quote") quote?: string
  ) {
    return this.exchangesService.getExchangesPairs({
      page: Number(page),
      limit: Number(limit),
      search,
      type,
      base,
      quote,
    });
  }
}
