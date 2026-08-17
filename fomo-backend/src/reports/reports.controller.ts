import { Controller, Post, Body, UseGuards, Req, Get, Query } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { JwtWalletGuard } from "src/auth/jwt.wallet.guard";
import { Request } from "express";
import { Roles } from "src/auth/role.decorator";
import { SearchReportDto } from "./dto/report.dto";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtWalletGuard)
  @Post()
  createReport(@Req() req: Request, @Body() body: any) {
    const wallet = req.user.wallet;
   
    return this.reportsService.createReport(wallet, body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllReports(@Query() query: SearchReportDto) {
    return this.reportsService.getAllReports(query);
  }
}
