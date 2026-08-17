import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { NftAccessService } from "./nft-access.service";
import { AccessResolverService } from "./access-resolver.service";

const userId = (req: Request): string => String((req.user as any)?._id || (req.user as any)?.id || "");
const walletOf = (req: Request): string => String((req.user as any)?.wallet || "");
const actor = (req: Request): string => String((req.user as any)?.email || (req.user as any)?._id || "admin");

/** Phase G — Unified FOMO Access Engine surface (user + admin). */
@Controller("access")
export class AccessEngineController {
  constructor(
    private readonly nft: NftAccessService,
    private readonly resolver: AccessResolverService,
  ) {}

  /* ───────── User ───────── */
  private async uid(req: Request): Promise<string> {
    let id = userId(req);
    if (!id) { const w = walletOf(req); if (w) id = await this.nft.resolveUserIdByWallet(w); }
    return id;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/membership")
  async myMembership(@Req() req: Request) {
    const m = await this.resolver.getMembership(await this.uid(req));
    return { success: true, data: m };
  }

  @UseGuards(JwtAuthGuard)
  @Get("/explain")
  async explain(@Req() req: Request, @Query("capability") capability: string) {
    const data = await this.resolver.explainAccess(await this.uid(req), capability || "earlyland.prime");
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post("/nft/activate")
  async activate(@Req() req: Request, @Body() body: any) {
    return this.nft.activate({
      userId: await this.uid(req),
      wallet: body?.wallet || walletOf(req),
      chainId: body?.chainId,
      contract: body?.contract || body?.contractAddress,
      tokenId: body?.tokenId,
      txHash: body?.txHash,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/nft/diagnostics")
  diagnosticsUser(@Query() q: any) {
    return this.nft.diagnostics({ wallet: q.wallet, chainId: q.chainId, contract: q.contract, tokenId: q.tokenId });
  }

  /* ───────── Admin: NFT Access ───────── */
  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/nft/rules")
  rules() {
    return this.nft.listRules();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/nft/rules")
  createRule(@Body() body: any) {
    return this.nft.createRule(body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Patch("/admin/nft/rules/:id")
  updateRule(@Param("id") id: string, @Body() body: any) {
    return this.nft.updateRule(id, body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/nft/activations")
  activations(@Query() q: any) {
    const filter: any = {};
    if (q.status) filter.status = q.status;
    if (q.tokenId) filter.tokenId = String(q.tokenId);
    return this.nft.listActivations(filter);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/nft/transfers")
  transfers() {
    return this.nft.listTransfers();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/nft/activations/:id/revoke")
  revokeActivation(@Param("id") id: string, @Body() body: any) {
    return this.nft.revokeActivation(id, body?.reason);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/nft/diagnostics")
  diagnosticsAdmin(@Query() q: any) {
    return this.nft.diagnostics({ wallet: q.wallet, chainId: q.chainId, contract: q.contract, tokenId: q.tokenId });
  }

  // Test-only ownership setter + transfer simulator (for E2E of transfer/resale).
  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/nft/test/ownership")
  setOwnership(@Body() body: any) {
    return this.nft.setTestOwnership(body?.chainId, body?.contract || body?.contractAddress, body?.tokenId, body?.wallet);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/nft/transfer")
  transfer(@Body() body: any) {
    return this.nft.reconcileTransfer({
      chainId: body?.chainId,
      contract: body?.contract || body?.contractAddress,
      tokenId: body?.tokenId,
      newWallet: body?.newWallet,
      newUserId: body?.newUserId,
      txHash: body?.txHash,
    });
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/nft/run-expiry")
  runExpiry() {
    return this.nft.runExpiry();
  }

  /** DEV/TEST ONLY — backdate a token's activation so expiry can be exercised in
   *  automated acceptance (guarded to the test ownership provider). */
  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/nft/test/expire")
  testExpire(@Body() body: any) {
    return this.nft.testExpireToken(body?.chainId, body?.contract || body?.contractAddress, body?.tokenId);
  }

  /* ───────── Admin: membership grant / explain ───────── */
  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/grant")
  grant(@Req() req: Request, @Body() body: any) {
    return this.resolver.adminGrant({
      userId: body?.userId,
      days: Number(body?.days) || 30,
      reason: body?.reason,
      grantedBy: actor(req),
      capabilityKey: body?.capabilityKey,
    });
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/entitlements/:id/revoke")
  revokeEntitlement(@Param("id") id: string) {
    return this.resolver.revokeEntitlement(id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/explain")
  async explainAdmin(@Query("userId") uid: string, @Query("capability") capability: string) {
    const data = await this.resolver.explainAccess(uid, capability || "earlyland.prime");
    return { success: true, data };
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/entitlements")
  entitlements(@Query("userId") uid: string) {
    return this.resolver.listEntitlements(uid);
  }
}
