import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { NftAccessService } from "./nft-access.service";
import { AccessResolverService } from "./access-resolver.service";

const userId = (req: Request): string => String((req.user as any)?._id || (req.user as any)?.id || "");
const walletOf = (req: Request): string => String((req.user as any)?.wallet || "");

/**
 * G27 — Personal NFT Access surface for the signed-in user. Uses the EXISTING
 * authenticated wallet identity (no new wallet provider). Presentation-ready:
 * the frontend never assembles rules + activations + entitlements itself.
 */
@Controller("me")
export class MeNftAccessController {
  constructor(
    private readonly nft: NftAccessService,
    private readonly resolver: AccessResolverService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("/nft-access")
  async myNftAccess(@Req() req: Request) {
    const wallet = walletOf(req);
    let uid = userId(req);
    if (!uid && wallet) uid = await this.nft.resolveUserIdByWallet(wallet);
    const [membership, access] = await Promise.all([
      this.resolver.getMembership(uid),
      this.nft.myNftAccess(uid, wallet),
    ]);
    return {
      success: true,
      membership: { allowed: membership.active, effectiveUntil: membership.expiresAt, sources: membership.sources },
      providerMode: access.providerMode,
      tokens: access.tokens,
    };
  }

  /**
   * Self-serve activation. Token identity comes from the request but the backend
   * RE-VERIFIES ownership against the authenticated wallet (never trusts the UI).
   */
  @UseGuards(JwtAuthGuard)
  @Post("/nft-access/activate")
  async activate(@Req() req: Request, @Body() body: any) {
    const wallet = walletOf(req);
    let uid = userId(req);
    if (!uid && wallet) uid = await this.nft.resolveUserIdByWallet(wallet);
    return this.nft.activate({
      userId: uid,
      wallet, // canonical: authenticated wallet, not a client-supplied one
      chainId: String(body?.chainId || ""),
      contract: String(body?.contract || body?.contractAddress || ""),
      tokenId: String(body?.tokenId || ""),
      txHash: body?.txHash,
    });
  }
}
