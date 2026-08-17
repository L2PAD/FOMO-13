import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { createHash, randomUUID } from "crypto";
import { Connection } from "mongoose";

import { INFO_RESOURCE_DEFINITIONS } from "./info.constants";
import { serializeInfoDocument } from "./helpers/info-normalization";
import {
  InfoUserRegistrationDto,
  InfoWalletRegistrationDto,
} from "./dto/info-wallet.dto";

@Injectable()
export class InfoWalletService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async check(walletAddress: string): Promise<Record<string, unknown>> {
    const wallet = await this.wallets().findOne({
      wallet_address: this.normalizeWallet(walletAddress),
    });
    return { registered: Boolean(wallet) };
  }

  async registerWallet(
    input: InfoWalletRegistrationDto
  ): Promise<Record<string, unknown>> {
    const walletAddress = this.normalizeWallet(input.wallet_address);
    const existing = await this.wallets().findOne({
      wallet_address: walletAddress,
    });
    if (existing) throw new BadRequestException("Wallet already registered");

    if (input.referral_code) {
      await this.assertReferralCode(input.referral_code);
    }
    const profile = this.createProfile(walletAddress, {
      twitter_username: this.normalizeTwitter(input.twitter_username),
      referred_by: this.normalizeCode(input.referral_code),
      twitter_connected: Boolean(input.twitter_username),
    });
    await this.insertProfile(profile);
    await this.incrementReferrer(profile.referred_by);
    return serializeInfoDocument(profile);
  }

  async registerUser(
    input: InfoUserRegistrationDto
  ): Promise<Record<string, unknown>> {
    const walletAddress = this.normalizeWallet(input.wallet_address);
    const existing = await this.wallets().findOne({
      wallet_address: walletAddress,
    });
    if (existing) {
      return this.completeExistingRegistration(existing, input);
    }

    if (input.referrer_code) {
      await this.assertReferralCode(input.referrer_code);
    }

    const profile = this.createProfile(walletAddress, {
      invite_code_used: this.normalizeCode(input.invite_code),
      referred_by: this.normalizeCode(input.referrer_code),
    });
    let consumedInvite: string | null = null;
    if (input.invite_code) {
      consumedInvite = await this.consumeInvite(input.invite_code);
    }
    try {
      await this.insertProfile(profile);
    } catch (error) {
      if (consumedInvite) await this.releaseInvite(consumedInvite);
      throw error;
    }
    await this.incrementReferrer(profile.referred_by);
    return serializeInfoDocument(profile);
  }

  private async completeExistingRegistration(
    existing: Record<string, any>,
    input: InfoUserRegistrationDto
  ): Promise<Record<string, unknown>> {
    const walletAddress = this.normalizeWallet(existing.wallet_address);

    if (input.invite_code && !existing.invite_code_used) {
      const inviteCode = await this.consumeInvite(input.invite_code);
      try {
        const result = await this.wallets().updateOne(
          {
            wallet_address: walletAddress,
            $or: [
              { invite_code_used: { $exists: false } },
              { invite_code_used: null },
              { invite_code_used: "" },
            ],
          },
          {
            $set: {
              invite_code_used: inviteCode,
              updated_at: new Date(),
            },
          }
        );
        if (!result.matchedCount) {
          await this.releaseInvite(inviteCode);
        }
      } catch (error) {
        await this.releaseInvite(inviteCode);
        throw error;
      }
    }

    if (input.referrer_code && !existing.referred_by) {
      const referrerCode = this.normalizeCode(input.referrer_code);
      if (referrerCode === existing.referral_code) {
        throw new BadRequestException("Self-referral is not allowed");
      }
      await this.assertReferralCode(input.referrer_code);
      const result = await this.wallets().updateOne(
        {
          wallet_address: walletAddress,
          $or: [
            { referred_by: { $exists: false } },
            { referred_by: null },
            { referred_by: "" },
          ],
        },
        {
          $set: {
            referred_by: referrerCode,
            updated_at: new Date(),
          },
        }
      );
      if (result.matchedCount) {
        await this.incrementReferrer(referrerCode);
      }
    }

    return this.getUser(walletAddress);
  }

  async getUser(walletAddress: string): Promise<Record<string, unknown>> {
    const document = await this.wallets().findOne({
      wallet_address: this.normalizeWallet(walletAddress),
    });
    if (!document) throw new NotFoundException("User not found");
    return serializeInfoDocument(document);
  }

  async updateWallet(
    walletAddress: string,
    twitterUsername?: string
  ): Promise<Record<string, unknown>> {
    const normalizedWallet = this.normalizeWallet(walletAddress);
    const update: Record<string, unknown> = { updated_at: new Date() };
    if (twitterUsername !== undefined) {
      update.twitter_username = this.normalizeTwitter(twitterUsername);
      update.twitter_connected = Boolean(update.twitter_username);
    }
    const result = await this.wallets().updateOne(
      { wallet_address: normalizedWallet },
      { $set: update }
    );
    if (!result.matchedCount) throw new NotFoundException("Wallet not found");
    return this.getUser(normalizedWallet);
  }

  async unregister(
    walletAddress: string
  ): Promise<{ message: string; wallet_address: string }> {
    const normalized = this.normalizeWallet(walletAddress);
    const result = await this.wallets().deleteOne({
      wallet_address: normalized,
    });
    if (!result.deletedCount) throw new NotFoundException("Wallet not found");
    return {
      message: "Wallet unregistered successfully",
      wallet_address: normalized,
    };
  }

  async verifyInvite(inviteCode: string): Promise<Record<string, unknown>> {
    const code = this.normalizeCode(inviteCode);
    if (!code) return { valid: false };
    const invite = await this.invites().findOne(this.activeInviteFilter(code));
    return invite ? { valid: true, code } : { valid: false };
  }

  async connectTwitter(
    walletAddress: string,
    twitterUsername: string
  ): Promise<Record<string, unknown>> {
    const normalized = this.normalizeWallet(walletAddress);
    const username = this.normalizeTwitter(twitterUsername);
    if (!username)
      throw new BadRequestException("Twitter username is required");
    const result = await this.wallets().updateOne(
      { wallet_address: normalized },
      {
        $set: {
          twitter_connected: true,
          twitter_username: username,
          updated_at: new Date(),
        },
      }
    );
    if (!result.matchedCount) throw new NotFoundException("User not found");
    return this.getUser(normalized);
  }

  async acceptTerms(walletAddress: string): Promise<Record<string, unknown>> {
    const normalized = this.normalizeWallet(walletAddress);
    const now = new Date();
    const result = await this.wallets().updateOne(
      { wallet_address: normalized },
      {
        $set: {
          terms_accepted: true,
          terms_accepted_at: now,
          updated_at: now,
        },
      }
    );
    if (!result.matchedCount) throw new NotFoundException("User not found");
    return this.getUser(normalized);
  }

  async getReferrals(walletAddress: string): Promise<Record<string, unknown>> {
    const user = await this.getUser(walletAddress);
    const referralCode = String(user.referral_code || "");
    const referrals = await this.wallets()
      .find(
        { referred_by: referralCode },
        { projection: { _id: 0, wallet_address: 1, created_at: 1 } }
      )
      .sort({ created_at: -1 })
      .limit(1_000)
      .toArray();
    return {
      referral_code: referralCode,
      referral_count: referrals.length,
      referrals: referrals.map((item) => serializeInfoDocument(item)),
    };
  }

  normalizeWallet(walletAddress: unknown): string {
    const normalized = String(walletAddress || "")
      .trim()
      .toLowerCase();
    if (
      !normalized ||
      normalized.length > 200 ||
      /\s/.test(normalized) ||
      !/^[a-z0-9:_-]+$/.test(normalized)
    ) {
      throw new BadRequestException("Invalid wallet address");
    }
    return normalized;
  }

  private createProfile(
    walletAddress: string,
    extra: Record<string, unknown>
  ): Record<string, any> {
    const now = new Date();
    return {
      id: randomUUID(),
      wallet_address: walletAddress,
      referral_code: createHash("sha256")
        .update(walletAddress)
        .digest("hex")
        .slice(0, 8)
        .toUpperCase(),
      referred_by: null,
      invite_code_used: null,
      twitter_connected: false,
      twitter_username: null,
      terms_accepted: false,
      referral_count: 0,
      created_at: now,
      updated_at: now,
      ...extra,
    };
  }

  private async insertProfile(profile: Record<string, unknown>): Promise<void> {
    try {
      await this.wallets().insertOne(profile);
    } catch (error) {
      if ((error as any)?.code === 11000) {
        throw new BadRequestException("Wallet already registered");
      }
      throw error;
    }
  }

  private async assertReferralCode(input: string): Promise<void> {
    const code = this.normalizeCode(input);
    const exists = await this.wallets().findOne({ referral_code: code });
    if (!exists) throw new BadRequestException("Invalid referral code");
  }

  private async incrementReferrer(code: unknown): Promise<void> {
    if (!code) return;
    await this.wallets().updateOne(
      { referral_code: String(code) },
      { $inc: { referral_count: 1 }, $set: { updated_at: new Date() } }
    );
  }

  private async consumeInvite(input: string): Promise<string> {
    const code = this.normalizeCode(input);
    if (!code) throw new BadRequestException("Invalid invite code");
    const result = await this.invites().updateOne(
      this.activeInviteFilter(code),
      { $inc: { used_count: 1 }, $set: { updated_at: new Date() } }
    );
    if (!result.matchedCount) {
      throw new BadRequestException("Invalid invite code");
    }
    return code;
  }

  private async releaseInvite(code: string): Promise<void> {
    await this.invites().updateOne(
      { code, used_count: { $gt: 0 } },
      { $inc: { used_count: -1 }, $set: { updated_at: new Date() } }
    );
  }

  private activeInviteFilter(code: string): Record<string, unknown> {
    return {
      code,
      active: { $ne: false },
      $and: [
        {
          $or: [
            { expires_at: { $exists: false } },
            { expires_at: null },
            { expires_at: { $gt: new Date() } },
          ],
        },
        {
          $or: [
            { max_uses: { $exists: false } },
            { max_uses: null },
            {
              $expr: {
                $lt: [{ $ifNull: ["$used_count", 0] }, "$max_uses"],
              },
            },
          ],
        },
      ],
    };
  }

  private normalizeCode(input?: string): string | null {
    const code = String(input || "")
      .trim()
      .toUpperCase();
    if (!code) return null;
    if (code.length > 100 || !/^[A-Z0-9_-]+$/.test(code)) {
      throw new BadRequestException("Invalid code");
    }
    return code;
  }

  private normalizeTwitter(input?: string): string | null {
    if (input === undefined || input === null) return null;
    const value = String(input).trim().replace(/^@/, "");
    if (!value) return null;
    if (!/^[A-Za-z0-9_]{1,30}$/.test(value)) {
      throw new BadRequestException("Invalid Twitter username");
    }
    return value;
  }

  private wallets(): any {
    return this.collection(
      INFO_RESOURCE_DEFINITIONS["wallet-profiles"].collection
    );
  }

  private invites(): any {
    return this.collection(
      INFO_RESOURCE_DEFINITIONS["invite-codes"].collection
    );
  }

  private collection(name: string): any {
    if (!this.connection.db) throw new Error("MongoDB connection is not ready");
    return this.connection.db.collection(name);
  }
}
