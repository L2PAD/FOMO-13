import { Request } from "express";
import { Req, Res, UseGuards, Param, Body, Query, BadRequestException } from "@nestjs/common";
import { Controller, Post, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtWalletGuard } from "./jwt.wallet.guard";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.auth.guard";
import { Roles } from "./role.decorator";
import { TwoFactorService } from "./two-factor/two-factor.service";
import { UserService } from "src/user/user.service";
import { JwtTempGuard } from "./jwt.temp.guard";
import { VerifyWalletDto } from "./dto/verify-wallet.dto";

export interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role: string;
    wallet: string;
  };
}

@Controller("auth")
export class AuthController {
  private readonly maxAgeToken: number = 24 * 60 * 60 * 1000;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) { }


  @Get('nonce')
  async getNonce(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('Wallet address required');
    }

    const nonce = await this.authService.generateNonce(address);
    return { nonce };
  }

  @Post('verify')
  async verifyWallet(@Body() dto: VerifyWalletDto) {
    const { address, message, signature } = dto;

    await this.authService.verifySignature(
      address,
      message,
      signature,
    );

    return this.authService.verifyAndLogin(
      address,
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("/send-confirm")
  sendConfirmEmail(@Req() req: Request, @Query('email') email?: string) {
    const wallet: string = req.user.wallet;

    return this.authService.sendAgainConfirmEmail(wallet, email);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Post('/email/verify')
  async verifyEmail(
    @Req() req: any,
    @Body() body: { code: string; inviteCode?: string }
  ) {
    const userId = req.user._id;
    const wallet = req.user.wallet;

    return this.authService.confirmEmailByCode(
      userId,
      wallet,
      body.code,
      body.inviteCode,
    );
  }

  // DEV/PREVIEW ONLY — skip email confirmation and activate the wallet account.
  // Gated server-side behind EMAIL_DEV_BYPASS / IS_LOCAL_RUN.
  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Post('/email/skip')
  async skipEmail(
    @Req() req: any,
    @Body() body: { inviteCode?: string }
  ) {
    return this.authService.skipEmailForWallet(
      req.user._id,
      req.user.wallet,
      body?.inviteCode,
    );
  }


  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("/reset")
  async sendResetLink(@Req() req: Request) {
    const wallet: string = req.user.wallet;

    return this.authService.resetPassword(wallet);
  }

  @Get("/reset/:code")
  async confirmReset(@Req() req: Request, @Res() res: any) {
    const code: string = req.params.code;
    const isSuccess: boolean = await this.authService.confrimResetPassword(
      code
    );

    if (isSuccess) {
      return res.redirect(
        `${this.configService.get("FRONT_URL")}/gemslab/profile`
      );
    }
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("2fa/setup")
  async setup2FA(@Req() request: Request) {
    return this.authService.setup2FA(request.user.email, request.user._id);
  }

  @Roles("any")
  @UseGuards(JwtTempGuard)
  @Post("2fa/verify")
  async verify2FA(@Req() request: Request, @Body("code") code: string) {
    return this.authService.verify2FA(request.user._id, code);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("2fa/disable/:code")
  async disable2FA(@Req() request: Request) {
    const code: string = request.params.code;

    return this.authService.disable2FA(request.user._id, code);
  }
}
