import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { MoneyService } from "./money.service";
import { MoneySagaService } from "./money-saga.service";

@Controller("money")
@UseGuards(JwtAuthGuard)
export class MoneyController {
  constructor(
    private readonly money: MoneyService,
    private readonly saga: MoneySagaService,
  ) {}
  private uid(req: Request) { return String((req.user as any)._id); }

  @Get("me/balance")
  async myBalance(@Req() req: Request, @Query("asset") asset?: string) {
    return this.money.balance(this.uid(req), (asset || "USDC").toUpperCase());
  }

  @Get("me/transactions")
  async myTx(@Req() req: Request, @Query("limit") limit?: string) {
    return { items: await this.money.transactions(this.uid(req), Math.min(Number(limit) || 100, 300)) };
  }

  @Get("me/custody-reconcile")
  async myReconcile(@Req() req: Request) {
    return this.money.custodyReconcileUser(this.uid(req));
  }

  // Checkout readiness — memberships checks this BEFORE starting so a user never
  // enters a half-finished flow when settlement lots / engine aren't ready.
  @Get("checkout/readiness")
  async checkoutReadiness() {
    return this.money.checkoutReadiness();
  }

  @Post("deposits/confirm")
  async confirmDeposit(@Req() req: Request, @Body() body: any) {
    return this.money.confirmDeposit(this.uid(req), body?.txHash, (body?.network || "ZKSYNC").toUpperCase());
  }

  // Deposit Recovery — code-driven: RPC-verify txHash, upsert deposit, credit (idempotent).
  @Post("deposits/recover")
  async recoverDeposit(@Req() req: Request, @Body() body: any) {
    return this.money.recoverDepositByTx(this.uid(req), body?.txHash, (body?.network || "ZKSYNC").toUpperCase());
  }

  // Auto-discover recent on-chain deposits from the user's wallet not yet credited.
  @Get("me/recoverable-deposits")
  async myRecoverable(@Req() req: Request) {
    return this.money.recoverableDeposits(this.uid(req));
  }

  @Post("withdrawals")
  async withdraw(@Req() req: Request, @Body() body: any) {
    return this.money.requestWithdrawal(this.uid(req), body);
  }

  // H4/P15 — user-signed withdrawUSD confirmation (RPC-verified, no server signer).
  @Post("withdrawals/:id/confirm-web3")
  async confirmWithdrawWeb3(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.money.confirmWithdrawalWeb3(this.uid(req), id, body?.txHash);
  }

  // ---- H4 custody Purchase Saga (staged checkout) ----
  // Start: creates purchase, reserves ledger, provisions custody item (owner),
  // returns USER_SIGNATURE_REQUIRED + custodyAction (or CUSTODY_ITEM_PENDING).
  @Post("purchases")
  async startPurchase(@Req() req: Request, @Body() body: any) {
    return this.saga.start(this.uid(req), body || {});
  }

  // User submitted the safeMoneyUSD lock tx → backend RPC-verifies (idempotent).
  @Post("purchases/:id/custody-confirm")
  async custodyConfirm(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.saga.confirmCustodyTx(this.uid(req), id, body?.txHash);
  }

  @Get("purchases/:id")
  async getPurchase(@Param("id") id: string) {
    return this.saga.get(id);
  }

  // Legacy off-chain ledger checkout (kept for backward-compat / internal tools).
  @Post("purchases/legacy")
  async legacyCheckout(@Req() req: Request, @Body() body: any) {
    return this.money.checkout(this.uid(req), body || {});
  }
}
