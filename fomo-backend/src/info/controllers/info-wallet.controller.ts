import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import {
  InfoAcceptTermsDto,
  InfoInviteVerifyDto,
  InfoTwitterConnectDto,
  InfoUserRegistrationDto,
  InfoWalletRegistrationDto,
  InfoWalletUpdateDto,
} from "../dto/info-wallet.dto";
import { InfoWalletService } from "../info-wallet.service";

@Controller("info")
export class InfoWalletController {
  constructor(private readonly wallets: InfoWalletService) {}

  @Get("wallet/check/:walletAddress")
  check(@Param("walletAddress") walletAddress: string) {
    return this.wallets.check(walletAddress);
  }

  @Post("wallet/register")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  registerWallet(
    @Req() request: Request,
    @Body() body: InfoWalletRegistrationDto
  ) {
    this.assertWalletAccess(request, body.wallet_address);
    return this.wallets.registerWallet(body);
  }

  @Put("wallet/update/:walletAddress")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  updateWallet(
    @Req() request: Request,
    @Param("walletAddress") walletAddress: string,
    @Body() body: InfoWalletUpdateDto,
    @Query("twitter_username") twitterUsername?: string
  ) {
    this.assertWalletAccess(request, walletAddress);
    return this.wallets.updateWallet(
      walletAddress,
      body.twitter_username ?? twitterUsername
    );
  }

  @Delete("wallet/unregister/:walletAddress")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  unregister(
    @Req() request: Request,
    @Param("walletAddress") walletAddress: string
  ) {
    this.assertWalletAccess(request, walletAddress);
    return this.wallets.unregister(walletAddress);
  }

  @Delete("wallet/:walletAddress")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  deleteWallet(
    @Req() request: Request,
    @Param("walletAddress") walletAddress: string
  ) {
    this.assertWalletAccess(request, walletAddress);
    return this.wallets.unregister(walletAddress);
  }

  @Post("user/register")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  registerUser(@Req() request: Request, @Body() body: InfoUserRegistrationDto) {
    this.assertWalletAccess(request, body.wallet_address);
    return this.wallets.registerUser(body);
  }

  @Get("user/:walletAddress")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  getUser(
    @Req() request: Request,
    @Param("walletAddress") walletAddress: string
  ) {
    this.assertWalletAccess(request, walletAddress);
    return this.wallets.getUser(walletAddress);
  }

  @Post("invite/verify")
  verifyInvite(@Body() body: InfoInviteVerifyDto) {
    return this.wallets.verifyInvite(body.invite_code);
  }

  @Post("twitter/connect")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  connectTwitter(@Req() request: Request, @Body() body: InfoTwitterConnectDto) {
    this.assertWalletAccess(request, body.wallet_address);
    return this.wallets.connectTwitter(
      body.wallet_address,
      body.twitter_username
    );
  }

  @Post("user/accept-terms")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  acceptTerms(@Req() request: Request, @Body() body: InfoAcceptTermsDto) {
    this.assertWalletAccess(request, body.wallet_address);
    return this.wallets.acceptTerms(body.wallet_address);
  }

  @Get("referrals/:walletAddress")
  @UseGuards(JwtAuthGuard)
  @Roles("any")
  getReferrals(
    @Req() request: Request,
    @Param("walletAddress") walletAddress: string
  ) {
    this.assertWalletAccess(request, walletAddress);
    return this.wallets.getReferrals(walletAddress);
  }

  private assertWalletAccess(request: Request, walletAddress: string): void {
    const requested = this.wallets.normalizeWallet(walletAddress);
    const roles = Array.isArray(request.user?.role)
      ? request.user.role
      : [request.user?.role];
    if (roles.some((role) => ["admin", "moderator"].includes(String(role)))) {
      return;
    }
    if (!request.user?.wallet) {
      throw new ForbiddenException("Authenticated wallet is missing");
    }
    const authenticated = this.wallets.normalizeWallet(request.user.wallet);
    if (requested !== authenticated) {
      throw new ForbiddenException(
        "Authenticated wallet does not match request"
      );
    }
  }
}
