import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { RankResolverService } from "./rank-resolver.service";
import { XpLedgerService } from "./xp-ledger.service";
import { XP_MAX } from "./xp-rank.model";

@Controller("admin/xp")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class XpController {
  constructor(
    private readonly rankResolver: RankResolverService,
    private readonly ledger: XpLedgerService
  ) {}

  /* ------- Ranks ------- */
  @Get("ranks")
  async getRanks() {
    return { xpMax: XP_MAX, ranks: await this.rankResolver.getRanks() };
  }

  @Put("ranks")
  async updateRanks(@Req() req: Request, @Body() body: any) {
    const list = Array.isArray(body) ? body : body?.ranks;
    const ranks = await this.rankResolver.updateRanks(list, (req.user as any)?._id);
    return { xpMax: XP_MAX, ranks };
  }

  @Get("ranks/preview")
  async preview(@Query("xp") xp: string) {
    return this.rankResolver.resolve(Number(xp) || 0);
  }

  /* ------- Rules ------- */
  @Get("rules")
  async getRules() {
    return { rules: await this.ledger.getRules() };
  }

  @Put("rules/:eventType")
  async updateRule(@Param("eventType") eventType: string, @Body() body: any) {
    return this.ledger.updateRule(eventType, body || {});
  }

  /* ------- Ledger / history ------- */
  @Get("transactions/:userId")
  async getTransactions(
    @Param("userId") userId: string,
    @Query("limit") limit: string
  ) {
    const tx = await this.ledger.getTransactions(userId, Number(limit) || 50);
    const ledgerXp = await this.ledger.computeLedgerXp(userId);
    const rank = this.rankResolver.resolveSync(ledgerXp);
    return { userId, ledgerXp, rank, transactions: tx };
  }

  @Post("award")
  async award(@Body() body: any) {
    return this.ledger.award(body);
  }

  @Post("reverse/:transactionId")
  async reverse(
    @Param("transactionId") transactionId: string,
    @Body() body: any
  ) {
    return this.ledger.reverse(transactionId, body?.reason);
  }

  @Get("reconcile")
  async reconcile(@Query("userId") userId: string, @Query("fix") fix: string) {
    return this.ledger.reconcile(userId || undefined, fix === "true");
  }

  @Get("reconciliation")
  async reconciliationAll() {
    return this.ledger.reconcile(undefined, false);
  }

  @Get("reconciliation/:userId")
  async reconciliationUser(@Param("userId") userId: string) {
    return this.ledger.reconcile(userId, false);
  }

  @Post("reconciliation/:userId/fix")
  async reconciliationFix(@Param("userId") userId: string) {
    const ledgerXp = await this.ledger.recomputeUser(userId);
    return { userId, fixed: true, ledgerXp };
  }

  @Post("migrate")
  async migrate(@Body() body: any) {
    return this.ledger.migrateLegacyBalances(body?.version || "v1");
  }

  /* ------- Demo ------- */
  @Post("demo/reset")
  async demoReset() {
    return this.ledger.resetDemo();
  }
}
