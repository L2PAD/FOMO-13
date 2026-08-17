import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { RequireMoneyPermission } from "src/auth/permission.decorator";
import { MoneyService } from "./money.service";
import { MoneySagaService } from "./money-saga.service";
import { MoneyChainService } from "./money-chain.service";
import { WithdrawalExecutorService } from "./withdrawal-executor.service";
import { MoneyAcquiringService } from "./money-acquiring.service";
import { MoneyPermissionGuard } from "./money-permission.guard";
import { AdminPermissionsService } from "./admin-permissions.service";
import { ZKSYNC_CUSTODY_MANIFEST } from "./contracts/zksync-custody.manifest";

@Controller("admin/money")
@Roles("admin,moderator")
@UseGuards(JwtAuthGuard, MoneyPermissionGuard)
export class MoneyAdminController {
  constructor(
    private readonly money: MoneyService,
    private readonly saga: MoneySagaService,
    private readonly chain: MoneyChainService,
    private readonly executor: WithdrawalExecutorService,
    private readonly acquiring: MoneyAcquiringService,
    private readonly perms: AdminPermissionsService,
    @InjectConnection() private readonly conn: Connection,
  ) {}
  private actor(req: Request) { return String((req.user as any)?.email || (req.user as any)?._id || "admin"); }
  private actorRoles(req: Request): string[] { const r = (req.user as any)?.role; return Array.isArray(r) ? r : [r].filter(Boolean); }
  private async audit(req: Request, entry: any) {
    try {
      await this.conn.collection("money_admin_audit").insertOne({
        ...entry,
        actorId: String((req.user as any)?._id || ""),
        actorEmail: String((req.user as any)?.email || ""),
        actorRole: (req as any).moneyTemplate || null,
        permissionUsed: (req as any).moneyPermissionUsed || null,
        at: new Date(),
      });
    } catch { /* best-effort */ }
  }

  @Get("overview")
  overview() { return this.money.overview(); }

  @Get("operator-overview")
  operatorOverview() { return this.money.operatorOverview(); }

  @Get("revenue-analytics")
  revenueAnalytics() { return this.money.revenueAnalytics(); }

  @Get("statistics")
  statistics() { return this.money.statisticsSlice(); }

  @Get("statistics/timeseries")
  statisticsTimeseries(@Query("days") days?: string) { return this.money.statisticsTimeseries(Number(days) || 30); }

  @Get("statistics/users")
  statisticsUsers(@Query("limit") limit?: string) { return this.money.financeUsersTable(Math.min(Number(limit) || 100, 500)); }

  @Get("reconciliation")
  reconciliation() { return this.money.reconciliation(); }

  @Get("diagnostics")
  diagnostics() { return this.money.diagnostics(); }

  @Get("purchases")
  purchases(@Query("limit") limit?: string, @Query("status") status?: string) { return this.money.purchasesTable(Number(limit) || 100, status); }

  @Get("purchases/:id/chain")
  purchaseChain(@Param("id") id: string) { return this.money.purchaseChain(id); }

  @Get("withdrawals")
  withdrawals(@Query("limit") limit?: string) { return this.money.withdrawalsTable(Number(limit) || 100); }

  @RequireMoneyPermission("MONEY_WITHDRAW_EXECUTE")
  @Post("withdrawals/:id/execute")
  async executeWithdrawal(@Param("id") id: string, @Req() req: Request) {
    const r = await this.executor.execute(id);
    await this.audit(req, { action: "money.withdrawal.execute", withdrawalId: id, result: (r as any)?.code, txHash: (r as any)?.txHash || null });
    return r;
  }

  @Get("acquiring/executor/readiness")
  executorReadiness(@Query("networkId") networkId?: string) { return this.acquiring.executorReadiness(networkId); }

  @Get("acquiring/deposit-verification/mode")
  async depositVerificationMode() { return this.acquiring.depositPolicy(); }

  @Get("acquiring/withdrawal-model")
  withdrawalModel(@Query("networkId") networkId?: string) { return this.acquiring.withdrawalExecutionModel(networkId); }

  @Get("acquiring/deposit-verification/:txHash")
  verifyDeposit(@Param("txHash") txHash: string) { return this.acquiring.verifyDepositOnChain(txHash); }

  @Get("balances")
  balances(@Query("limit") limit?: string) { return this.money.balancesTable(Math.min(Number(limit) || 100, 500)); }

  @Get("users/:userId/finance")
  userFinance(@Param("userId") userId: string) { return this.money.userFinance(userId); }

  @Get("users/:userId")
  user(@Param("userId") userId: string) { return this.money.userMoney(userId); }

  /* ===== Phase H2 — FOMO Acquiring Control Center ===== */
  @Get("acquiring/networks")
  networks() { return this.acquiring.listNetworks(); }

  @Get("acquiring/network/:networkId")
  network(@Param("networkId") networkId: string) { return this.acquiring.getNetwork(networkId); }

  @RequireMoneyPermission("MONEY_SETTINGS_EDIT")
  @Roles("admin")
  @Post("acquiring/network/:networkId")
  async updateNetwork(@Param("networkId") networkId: string, @Body() body: any, @Req() req: Request) {
    return this.acquiring.updateNetwork(networkId, body || {}, this.actor(req), body?.reason);
  }

  @Get("acquiring/credentials")
  credentials() { return this.acquiring.listCredentials(); }

  @RequireMoneyPermission("MONEY_CREDENTIALS_MANAGE")
  @Roles("admin")
  @Post("acquiring/credentials")
  createCredential(@Body() body: any, @Req() req: Request) { return this.acquiring.createCredential(body || {}, this.actor(req)); }

  @RequireMoneyPermission("MONEY_CREDENTIALS_MANAGE")
  @Roles("admin")
  @Post("acquiring/credentials/:id/test")
  testCredential(@Param("id") id: string, @Req() req: Request) { return this.acquiring.testCredential(id, this.actor(req)); }

  @RequireMoneyPermission("MONEY_CREDENTIALS_MANAGE")
  @Roles("admin")
  @Post("acquiring/credentials/:id/activate")
  activateCredential(@Param("id") id: string, @Req() req: Request) { return this.acquiring.setCredentialStatus(id, "ACTIVE", this.actor(req)); }

  @RequireMoneyPermission("MONEY_CREDENTIALS_MANAGE")
  @Roles("admin")
  @Post("acquiring/credentials/:id/deactivate")
  deactivateCredential(@Param("id") id: string, @Req() req: Request) { return this.acquiring.setCredentialStatus(id, "INACTIVE", this.actor(req)); }

  @RequireMoneyPermission("MONEY_CREDENTIALS_MANAGE")
  @Roles("admin")
  @Post("acquiring/credentials/:id/revoke")
  revokeCredential(@Param("id") id: string, @Req() req: Request) { return this.acquiring.setCredentialStatus(id, "REVOKED", this.actor(req)); }

  @RequireMoneyPermission("MONEY_CREDENTIALS_MANAGE")
  @Roles("admin")
  @Post("acquiring/credentials/migrate-env")
  migrateEnvSigner(@Body() body: any, @Req() req: Request) { return this.acquiring.migrateEnvSigner(body?.networkId, this.actor(req)); }

  @Get("acquiring/deposits")
  deposits(@Query("limit") limit?: string) { return this.acquiring.deposits(Number(limit) || 100); }

  @Get("acquiring/events")
  events(@Query("limit") limit?: string) { return this.acquiring.events(Number(limit) || 100); }

  @Get("acquiring/audit")
  auditLog(@Query("limit") limit?: string) { return this.acquiring.auditLog(Number(limit) || 100); }

  @Get("acquiring/diagnostics")
  acquiringDiagnostics() { return this.acquiring.diagnostics(); }

  @Get("acquiring/reconciliation")
  acquiringReconciliation() { return this.acquiring.reconciliation(); }

  @Get("explain")
  explain(@Query("userId") userId?: string, @Query("txHash") txHash?: string, @Query("purchaseId") purchaseId?: string) {
    return this.money.explain({ userId, txHash, purchaseId });
  }

  @RequireMoneyPermission("MONEY_ADJUST")
  @Post("users/:userId/adjust")
  async adjust(@Param("userId") userId: string, @Body() body: any, @Req() req: Request) {
    const actor = this.actor(req);
    const r = await this.money.adjust(userId, body || {}, actor);
    await this.audit(req, { action: "money.adjust", userId, delta: body?.amount, reason: body?.reason, reference: body?.reference, before: r.before, after: r.after });
    return r;
  }

  @RequireMoneyPermission("MONEY_WITHDRAW_EXECUTE")
  @Post("withdrawals/:id/confirm")
  async confirmWithdrawal(@Param("id") id: string, @Body() body: any, @Req() req: Request) {
    const r = await this.money.confirmWithdrawal(id, body?.txHash);
    await this.audit(req, { action: "money.withdrawal.confirm", withdrawalId: id, txHash: body?.txHash || null, reason: body?.reason || "" });
    return r;
  }

  @RequireMoneyPermission("MONEY_WITHDRAW_REVIEW")
  @Post("withdrawals/:id/release")
  async releaseWithdrawal(@Param("id") id: string, @Body() body: any, @Req() req: Request) {
    const r = await this.money.releaseWithdrawal(id, body?.reason);
    await this.audit(req, { action: "money.withdrawal.release", withdrawalId: id, reason: body?.reason });
    return r;
  }

  @RequireMoneyPermission("MONEY_ADJUST")
  @Post("purchases/:id/settle")
  settle(@Param("id") id: string) { return this.money.settle(id); }

  /* ===== H4 — custody Purchase Saga (owner-signed settlement / refund) ===== */
  @Get("custody/manifest")
  custodyManifest() { return ZKSYNC_CUSTODY_MANIFEST; }

  @Get("custody/owner-settlement")
  ownerSettlement() { return this.money.ownerSettlementStatus(); }

  @Get("custody/decomposition")
  custodyDecomposition() { return this.money.contractDecomposition(); }

  @Get("custody/double-spend-forensics")
  doubleSpendForensics() { return this.money.custodyDoubleSpendForensics(); }

  @Get("stats")
  moneyStats(@Query("days") days?: string) { return this.money.moneyStats(Math.min(Number(days) || 30, 90)); }

  @Get("users/:userId/custody-reconcile")
  userCustodyReconcile(@Param("userId") userId: string) { return this.money.custodyReconcileUser(userId); }

  // Deposit Recovery on behalf of a user (RPC-verified, idempotent, code-driven).
  @RequireMoneyPermission("MONEY_ADJUST")
  @Post("users/:userId/deposits/recover")
  async adminRecoverDeposit(@Param("userId") userId: string, @Body() body: any, @Req() req: Request) {
    const r = await this.money.recoverDepositByTx(userId, body?.txHash, (body?.network || "ZKSYNC").toUpperCase());
    await this.audit(req, { action: "money.deposit.recover", userId, txHash: body?.txHash, result: (r as any)?.status });
    return r;
  }

  @RequireMoneyPermission("MONEY_WITHDRAW_EXECUTE")
  @Post("purchases/:id/owner-settle")
  async ownerSettle(@Param("id") id: string, @Req() req: Request) {
    const r = await this.saga.settleOwner(id, this.actor(req));
    await this.audit(req, { action: "money.purchase.owner_settle", purchaseId: id, result: (r as any)?.status });
    return r;
  }

  @RequireMoneyPermission("MONEY_WITHDRAW_REVIEW")
  @Post("purchases/:id/refund")
  async refundPurchase(@Param("id") id: string, @Req() req: Request) {
    const r = await this.saga.refund(id, this.actor(req));
    await this.audit(req, { action: "money.purchase.refund", purchaseId: id, result: (r as any)?.status });
    return r;
  }

  /* ===== H5 — CLIENT-SIGNED owner settlement (operator connects owner wallet in CRM) =====
     No server-held owner key. Backend tells the CRM what to sign, then RPC-verifies the tx. */
  @Get("custody/connect-status")
  custodyConnectStatus() { return this.chain.custodyConnectStatus(); }

  @RequireMoneyPermission("MONEY_WITHDRAW_EXECUTE")
  @Post("purchases/:id/owner-prepare")
  ownerPrepare(@Param("id") id: string) { return this.saga.prepareOwnerAction(id); }

  @RequireMoneyPermission("MONEY_WITHDRAW_EXECUTE")
  @Post("purchases/:id/owner-submit")
  async ownerSubmit(@Param("id") id: string, @Body() body: any, @Req() req: Request) {
    const kind = String(body?.kind || "").trim();
    const txHash = String(body?.txHash || "").trim();
    let r: any;
    if (kind === "createItem") r = await this.saga.submitItemCreated(id, txHash);
    else if (kind === "settle") r = await this.saga.submitOwnerSettle(id, txHash, this.actor(req));
    else if (kind === "refund") r = await this.saga.submitRefund(id, txHash, this.actor(req));
    else throw new BadRequestException("INVALID_KIND: expected createItem|settle|refund");
    await this.audit(req, { action: `money.purchase.owner_submit.${kind}`, purchaseId: id, txHash, result: r?.status });
    return r;
  }

  /* ===== H5 — Settlement lot pool (owner batch-provisions custody items) ===== */
  @Get("settlement-items/summary")
  settlementSummary() { return this.saga.settlementPoolSummary(); }

  @RequireMoneyPermission("MONEY_WITHDRAW_EXECUTE")
  @Post("settlement-items/prepare")
  settlementPrepare(@Body() body: any) { return this.chain.createItemParams(Number(body?.price)); }

  @RequireMoneyPermission("MONEY_WITHDRAW_EXECUTE")
  @Post("settlement-items/submit")
  async settlementSubmit(@Body() body: any, @Req() req: Request) {
    const r = await this.saga.addSettlementItem(Number(body?.price), String(body?.txHash || "").trim(), this.actor(req));
    await this.audit(req, { action: "money.settlement_item.add", price: body?.price, txHash: body?.txHash, result: r });
    return r;
  }

  /* ===== H3 — MONEY_* permissions management (Settings → Администраторы → Роли и права) ===== */
  // Current user's own effective permissions (for frontend gating; any authed admin).
  @Get("permissions/me")
  async myPermissions(@Req() req: Request) {
    const eff = await this.perms.effectiveFor(String((req.user as any)?._id || ""), this.actorRoles(req));
    return { userId: String((req.user as any)?._id || ""), email: String((req.user as any)?.email || ""), ...eff };
  }

  @Get("permissions/templates")
  permissionTemplates() { return this.perms.templatesCatalog(); }

  @RequireMoneyPermission("MONEY_SETTINGS_EDIT")
  @Get("permissions/admins")
  permissionAdmins() { return this.perms.listAdmins(); }

  @RequireMoneyPermission("MONEY_SETTINGS_EDIT")
  @Roles("admin")
  @Post("permissions/admins/:userId")
  async setPermissionAssignment(@Param("userId") userId: string, @Body() body: any, @Req() req: Request) {
    const r = await this.perms.setAssignment(userId, body || {}, this.actor(req));
    await this.audit(req, { action: "money.permissions.assign", targetUserId: userId, before: r.before, after: r.after, reason: body?.reason || "" });
    return r;
  }
}