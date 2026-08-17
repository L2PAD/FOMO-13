import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  HttpException,
  UnauthorizedException,
} from "@nestjs/common/exceptions";
import { JwtService } from "@nestjs/jwt/dist";
import { HttpStatus } from "@nestjs/common/enums";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { UserDto } from "../user/dto/user.dto";
import mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
import { ChangePasswordDto } from "../user/dto/change-password.dto";
import { UpdateUserDto } from "src/user/dto/update-user.dto";
import { User, UserDocument } from "src/user/user.model";
import { InviteModeratorDto } from "src/user/dto/invite-moderator.dto";
import { EmailService } from "src/email/email.service";
import { TwoFactorService } from "./two-factor/two-factor.service";
import { AuthChallenge } from './models/auth-challenge.model';
import { randomBytes } from "crypto";
import { ethers } from "ethers";
import { RefService } from "src/ref/ref.service";
import { UserActionLogsService } from "src/user-action-logs/user-action-logs.service";

interface IPayload {
  _id: mongoose.Types.ObjectId;
  email: string;
  isActive: boolean;
  role: Array<string>;
  is2FAEnabled?: boolean;
  wallet: string
}

export interface EmailVerificationResult {
  valid: boolean;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    _id: mongoose.Types.ObjectId;
    wallet: string;
    email: string;
    role: Array<string>;
    isActive: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AuthChallenge.name) private challengeModel: Model<AuthChallenge>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly twoFactorService: TwoFactorService,
    private readonly refService: RefService,
    private readonly userActionLogsService: UserActionLogsService,
  ) { }

  private async generateAuthCode(): Promise<string> {
    const characters: string =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code: string = "";

    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return code;
  }

  async registration(wallet: string, userDto: UserDto) {
    const passwordHash = await bcrypt.hash(
      userDto.password,
      Number(this.configService.get("SALT"))
    );

    const authCode: string = await this.generateAuthCode();

    await this.emailService.sendConfirmMail(
      userDto.email,
      authCode,
      userDto.username || String(userDto.email)
    );

    const newUser = await this.userModel.findOneAndUpdate(
      { wallet },
      {
        email: userDto.email,
        password: passwordHash,
        username: userDto.username,
        code: authCode,
      }
    );

    await this.userActionLogsService.log({
      userId: newUser?._id,
      walletAddress: wallet,
      actorType: "user",
      category: "auth",
      action: "auth.email_registration_started",
      title: "Email registration started",
      metadata: {
        email: userDto.email,
        username: userDto.username,
        wallet,
      },
    });

    return newUser;
  }

  async registrationByAdmin(
    userDto: UserDto | InviteModeratorDto,
    role: string
  ) {
    const passwordHash = await bcrypt.hash(
      userDto.password,
      Number(this.configService.get("SALT"))
    );

    const userData = {
      email: userDto.email,
      password: passwordHash,
      isActive: true,
      wallet: userDto.wallet,
      role: [role],
    };

    const newUser = await this.userModel.create(userData);

    await this.userActionLogsService.log({
      userId: newUser?._id,
      actorType: "system",
      category: "profile",
      action: "profile.created_by_admin",
      title: "User created by admin",
      metadata: {
        email: userDto.email,
        wallet: userDto.wallet,
        role,
      },
    });
  }

  async login(userDto: UserDto, candidate: any) {
    const isVerify = await bcrypt.compare(userDto.password, candidate.password);

    if (!isVerify || !candidate.isActive) {
      throw new UnauthorizedException({
        message: "Email or password is incorrect",
      });
    }

    if (candidate.is2FAEnabled) {
      const tokens = await this.createTokens(candidate, false);

      await this.userActionLogsService.log({
        userId: candidate._id,
        actorType: "user",
        category: "auth",
        action: "auth.login_2fa_required",
        title: "Login requires 2FA",
        metadata: {
          email: candidate.email,
          wallet: candidate.wallet,
          role: candidate.role,
        },
      });

      return {
        requires2FA: true,
        tokens,
        user: {
          _id: candidate._id,
          email: candidate.email,
          role: candidate.role,
          isActive: candidate.isActive,
        },
      };
    }

    const tokens = await this.createTokens(candidate);
    const isStaffLogin =
      Array.isArray(candidate.role) &&
      (candidate.role.includes("admin") || candidate.role.includes("moderator"));

    await this.userActionLogsService.log({
      userId: candidate._id,
      actorType: isStaffLogin ? "admin" : "user",
      category: "auth",
      action: isStaffLogin ? "auth.admin_login" : "auth.email_login",
      title: isStaffLogin ? "Admin login" : "Email login",
      metadata: {
        email: candidate.email,
        wallet: candidate.wallet,
        role: candidate.role,
      },
    });

    return {
      requires2FA: false,
      tokens,
      user: {
        _id: candidate._id,
        email: candidate.email,
        role: candidate.role,
        isActive: candidate.isActive,
      },
    };
  }

  async getDataByToken(token: string): Promise<UpdateUserDto> {
    const userData: UpdateUserDto = await this.checkJwtToken(token);

    return userData;
  }

  async refreshTokens(candidate: any) {
    return this.createTokens(candidate);
  }

  async createTokens(payload: IPayload, is2FAVerified = true) {
    const basePayload = {
      _id: payload._id,
      email: payload.email,
      wallet: payload.wallet || '',
      role: payload.role,
      isActive: payload.isActive,
      is2FAVerified,
      is2FAEnabled: !!payload.is2FAEnabled,
    };

    const accessToken = await this.jwtService.signAsync(basePayload, {
      expiresIn: "7d",
      secret: this.configService.get<string>("JWT_SECRET_ACCESS"),
    });

    const refreshToken = await this.jwtService.signAsync(basePayload, {
      expiresIn: "14d",
      secret: this.configService.get<string>("JWT_SECRET_REFRESH"),
    });

    return { accessToken, refreshToken };
  }


  async sendAgainConfirmEmail(wallet: string, email: string) {
    const existUser = await this.userModel.findOne({ email })

    if (existUser && existUser.wallet !== wallet) {
      throw new HttpException("Email is already in use", HttpStatus.BAD_REQUEST);
    }

    const authCode: string = await this.generateAuthCode();

    const user: User = await this.userModel.findOneAndUpdate({ wallet }, { code: authCode, emailTmp: email });

    await this.emailService.sendConfirmMail(email, authCode, user?.twitterData?.username);

    return true;
  }

  async confirmRegistration(email: string, code: string): Promise<boolean> {
    const candidate = await this.userModel.findOne({ emailTmp: email, code, isActive: false });

    if (!candidate) {
      throw new HttpException("Confirm error", HttpStatus.BAD_REQUEST);
    }

    candidate.isActive = true;
    candidate.email = candidate.emailTmp;
    candidate.emailTmp = "";
    candidate.code = "";

    await candidate.save();

    return true;
  }

  checkJwtToken(token: string, type = "access") {
    return this.jwtService.verify(token, {
      secret: this.configService.get(`JWT_SECRET_${type.toUpperCase()}`),
    });
  }

  async changePassword(passwords: ChangePasswordDto, passwordHash: string) {
    const isVerify = await bcrypt.compare(passwords.oldPassword, passwordHash);

    if (!isVerify) {
      throw new UnauthorizedException({ message: "Old Password is incorrect" });
    }
    return await bcrypt.hash(
      passwords.newPassword,
      Number(this.configService.get("SALT"))
    );
  }

  async changePasswordByAdmin(password: string) {
    return await bcrypt.hash(password, Number(this.configService.get("SALT")));
  }

  async createInitialToken(wallet: string): Promise<string> {
    const accessToken = await this.jwtService.sign(
      { wallet },
      {
        expiresIn: "1d",
        secret: this.configService.get<string>("JWT_SECRET_ACCESS"),
      }
    );

    return accessToken;
  }

  async resetPassword(wallet: string): Promise<any> {
    const authCode: string = await this.generateAuthCode();

    const user: User = await this.userModel.findOneAndUpdate(
      { wallet },
      { code: authCode }
    );

    if (!user)
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);

    await this.emailService.sendResetPassword(user.email, authCode, user?.username || user?.twitterData?.username);

    return { isSuccess: true };
  }

  async confrimResetPassword(code: string): Promise<any> {
    const passwordHash = await bcrypt.hash(
      code,
      Number(this.configService.get("SALT"))
    );

    const user: User = await this.userModel.findOneAndUpdate(
      { code },
      { code: "none", password: passwordHash }
    );

    if (!user)
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);

    return { isSuccess: true };
  }

  async setup2FA(email: string, userId: string): Promise<any> {
    const { otpauthUrl, base32 } = this.twoFactorService.generateSecret(email);

    await this.userModel.findByIdAndUpdate(userId, {
      twoFactorSecret: base32,
    });

    const qrCodeImage = await this.twoFactorService.generateQRCode(otpauthUrl);

    return { qrCodeImage, setupKey: base32 };
  }

  async verify2FA(userId: string, code: string): Promise<any> {
    const user = await this.userModel.findById(userId);

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException("2FA is not enabled for this user");
    }

    const isValid = this.twoFactorService.verifyToken(
      user.twoFactorSecret,
      code
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid 2FA code");
    }

    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      wallet: user.wallet,
      is2FAVerified: true,
      is2FAEnabled: true,
    };

    user.is2FAEnabled = true;

    await user.save();

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET_ACCESS"),
      expiresIn: "7d",
    });

    return { accessToken };
  }

  async disable2FA(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user || !user.is2FAEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException("2FA is not enabled for this user");
    }

    const isValid = this.twoFactorService.verifyToken(
      user.twoFactorSecret,
      code
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid 2FA code");
    }

    user.is2FAEnabled = false;
    user.twoFactorSecret = "";
    await user.save();

    return {
      message: "Two-factor authentication has been disabled successfully",
    };
  }

  async isSocialUsernameUnique(
    platform: "twitter" | "telegram" | "discord",
    username: string
  ): Promise<boolean> {
    if (!username) return true;

    const queryField = {
      twitter: "twitterData.username",
      telegram: "telegramData.username",
      discord: "discordData.username",
    }[platform];

    if (!queryField) return true;

    const existingUser = await this.userModel.findOne({
      [queryField]: username,
    });

    if (!existingUser) true

    return !existingUser?.isActive
  }


  async generateNonce(address: string): Promise<string> {
    const nonce = randomBytes(16).toString('hex')

    await this.challengeModel.create({
      address: address.toLowerCase(),
      nonce,
      used: false,
    })

    return nonce
  }


  async verifySignature(
    address: string,
    message: string,
    signature: string,
  ) {
    const nonceMatch = message.match(/Nonce:\s*(\w+)/)
    if (!nonceMatch) {
      throw new UnauthorizedException('Nonce not found')
    }

    const nonce = nonceMatch[1]

    const challenge = await this.challengeModel.findOne({
      nonce,
      address: address.toLowerCase(),
      used: false,
    })

    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired nonce')
    }

    const recovered = ethers.verifyMessage(message, signature)

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('Signature mismatch')
    }

    challenge.used = true
    await challenge.save()

    return true
  }

  async verifyAndLogin(
    address: string,
  ) {
    const wallet = address.toLowerCase();

    let user = await this.userModel.findOne({ wallet });
    const isNewWalletUser = !user;

    if (!user) {
      user = await this.userModel.create({
        wallet,
        role: ['user'],
        isActive: false,
        authProvider: 'wallet',
      });
    }

    const payload = {
      _id: user._id,
      email: user.email || null,
      role: user.role || ['user'],
      isActive: user.isActive,
      is2FAEnabled: false,
      is2FAVerified: true,
      wallet: user.wallet,
      authProvider: 'wallet',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET_ACCESS'),
      expiresIn: '7d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET_REFRESH'),
      expiresIn: '14d',
    });

    await this.userActionLogsService.log({
      userId: user._id,
      walletAddress: wallet,
      actorType: "user",
      category: isNewWalletUser ? "wallet" : "auth",
      action: isNewWalletUser ? "wallet.connected" : "auth.wallet_login",
      title: isNewWalletUser ? "Wallet connected" : "Wallet login",
      metadata: {
        wallet,
        authProvider: "wallet",
        createdUser: isNewWalletUser,
      },
    });

    return {
      requires2FA: false,
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        _id: user._id,
        wallet: user.wallet,
        email: user.email || null,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async confirmEmailByCode(
    userId: string,
    wallet: string,
    code: string,
    inviteCode?: string,
  ): Promise<EmailVerificationResult> {
    const confirmationCode = String(code || "").trim();
    const normalizedWallet = String(wallet || "").trim().toLowerCase();
    const normalizedInviteCode = String(inviteCode || "").trim();

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !normalizedWallet ||
      !confirmationCode
    ) {
      throw new HttpException('Invalid confirmation code', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      wallet: normalizedWallet,
      code: confirmationCode,
    });

    if (!user) {
      throw new HttpException('Invalid confirmation code', HttpStatus.BAD_REQUEST);
    }

    const verifiedEmail = String(user.emailTmp || "").trim();

    if (!verifiedEmail) {
      throw new HttpException('Email confirmation is not pending', HttpStatus.BAD_REQUEST);
    }

    user.isActive = true;
    user.isCodeActivated = true;
    user.code = '';
    user.email = verifiedEmail;
    user.emailTmp = '';

    await user.save();

    if (normalizedInviteCode) {
      await this.refService.activateUserRefCode(normalizedInviteCode, normalizedWallet);
    }

    await this.userActionLogsService.log({
      userId: user._id,
      walletAddress: normalizedWallet,
      actorType: "user",
      category: "auth",
      action: "auth.email_confirmed",
      title: "Email confirmed",
      metadata: {
        email: verifiedEmail,
        wallet: normalizedWallet,
        inviteCodeUsed: Boolean(normalizedInviteCode),
      },
    });

    const tokens = await this.createTokens(user as any);

    return {
      valid: true,
      tokens,
      user: {
        _id: user._id,
        wallet: user.wallet,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * DEV/PREVIEW ONLY — activate a wallet-authenticated account WITHOUT email
   * confirmation. Used when no SMTP/email provider is configured so testers can
   * finish registration and browse as an authorized user. Gated behind the
   * EMAIL_DEV_BYPASS / IS_LOCAL_RUN env flag; returns 403 otherwise.
   */
  async skipEmailForWallet(
    userId: string,
    wallet: string,
    inviteCode?: string,
  ): Promise<EmailVerificationResult> {
    const bypassEnabled =
      String(this.configService.get("EMAIL_DEV_BYPASS") ?? "").toLowerCase() === "true" ||
      String(this.configService.get("IS_LOCAL_RUN") ?? "").toLowerCase() === "true";

    if (!bypassEnabled) {
      throw new HttpException("Email skip is disabled", HttpStatus.FORBIDDEN);
    }

    const normalizedWallet = String(wallet || "").trim().toLowerCase();
    const normalizedInviteCode = String(inviteCode || "").trim();

    if (!mongoose.Types.ObjectId.isValid(userId) || !normalizedWallet) {
      throw new HttpException("Invalid request", HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      wallet: normalizedWallet,
    });

    if (!user) {
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
    }

    user.isActive = true;
    user.isCodeActivated = true;
    user.code = "";
    user.emailTmp = "";
    // Populate a synthetic email so email-gated UI treats the account as complete.
    if (!user.email) {
      user.email = `${normalizedWallet}@wallet.fomo`;
    }

    await user.save();

    if (normalizedInviteCode) {
      try {
        await this.refService.activateUserRefCode(normalizedInviteCode, normalizedWallet);
      } catch {
        /* non-fatal for a dev skip */
      }
    }

    try {
      await this.userActionLogsService.log({
        userId: user._id,
        walletAddress: normalizedWallet,
        actorType: "user",
        category: "auth",
        action: "auth.email_skipped",
        title: "Email confirmation skipped (dev bypass)",
        metadata: { wallet: normalizedWallet },
      });
    } catch {
      /* non-fatal */
    }

    const tokens = await this.createTokens(user as any);

    return {
      valid: true,
      tokens,
      user: {
        _id: user._id,
        wallet: user.wallet,
        email: user.email || null,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

}
