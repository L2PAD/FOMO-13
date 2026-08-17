import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { HttpService } from "@nestjs/axios/dist";
import { ConfigService } from "@nestjs/config";
import { MessageTelegramDto } from "./dto/message.dto";
import { AuthService } from "src/auth/auth.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { hostname } from "os";
import { TelegramBotLock, TelegramBotLockDocument } from "./model/telegram-bot-lock.model";
const TelegramBot = require("node-telegram-bot-api");

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: any;
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string;
  private readonly instanceId = `${hostname()}:${process.pid}:${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  private readonly lockKey = "telegram-bot-polling";
  private readonly leaseMs: number;
  private readonly acquireIntervalMs: number;
  private readonly conflictCooldownMs: number;
  private readonly disableOnConflict: boolean;
  private FRONT_URL: string;
  private channel: string;
  private telegramUrl: string;
  private twitterUrl: string;
  private discordUrl: string;
  private handlersRegistered = false;
  private isLeader = false;
  private isPolling = false;
  private leadershipTimer: NodeJS.Timeout | null = null;
  private pollingStartPromise: Promise<void> | null = null;
  private pollingStopPromise: Promise<void> | null = null;
  private conflictCooldownUntil = 0;
  private isShuttingDown = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @InjectModel(TelegramBotLock.name)
    private readonly telegramBotLockModel: Model<TelegramBotLockDocument>
  ) {
    this.token = this.configService.get("TELEGRAM_BOT_TOKEN");
    this.leaseMs = Number(this.configService.get("TELEGRAM_BOT_LEASE_MS") || 30_000);
    this.acquireIntervalMs = Number(
      this.configService.get("TELEGRAM_BOT_LEADER_CHECK_MS") || 5_000
    );
    this.conflictCooldownMs = Number(
      this.configService.get("TELEGRAM_BOT_CONFLICT_COOLDOWN_MS") || 60_000
    );
    this.disableOnConflict =
      String(this.configService.get("TELEGRAM_BOT_DISABLE_ON_CONFLICT") || "true") ===
      "true";
    this.FRONT_URL = this.configService.get("FRONT_URL");
    this.channel = "@FOMOcx";
    this.telegramUrl = "https://t.me/FOMOcx";
    this.twitterUrl = "https://twitter.com/FOMOWiki";
    this.discordUrl = "https://discord.gg/6TKhQsux8A";
  }

  async onModuleInit() {
    if (!this.token) {
      this.logger.warn("TELEGRAM_BOT_TOKEN is empty. Telegram bot was not started.");
      return;
    }

    this.bot = new TelegramBot(this.token, { polling: false });
    this.registerHandlers();

    try {
      const me = await this.bot.getMe();
      this.logger.log(
        `Telegram bot client ready: @${me?.username || "unknown"} (instance ${this.instanceId})`
      );
    } catch (error) {
      this.logger.error(`Telegram bot failed to initialize: ${String(error)}`);
    }

    await this.ensureLeadership();
    this.startLeadershipLoop();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;

    if (this.leadershipTimer) {
      clearInterval(this.leadershipTimer);
      this.leadershipTimer = null;
    }

    await this.stopPolling("module destroy");
    await this.releaseLeadership();

    if (!this.bot) {
      return;
    }
  }

  private registerHandlers() {
    if (!this.bot || this.handlersRegistered) {
      return;
    }

    this.handlersRegistered = true;

    this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const startPayload = String(match?.[1] || "").trim();
      await this.checkUserSubscribe(msg, startPayload);
    });

    this.bot.on("callback_query", async (callbackQuery) => {
      const action = callbackQuery.data;

      if (action === "check_subs") {
        await this.checkUserSubscribe(callbackQuery.message);
      }
    });

    this.bot.on("polling_error", (error) => {
      if (
        error.code === "ETELEGRAM" &&
        error.response &&
        error.response.error_code === 409
      ) {
        this.logger.warn(
          "Telegram polling conflict (409). Another bot process is likely already running."
        );
        this.conflictCooldownUntil = Date.now() + this.conflictCooldownMs;
        if (this.disableOnConflict) {
          this.conflictCooldownUntil = Number.MAX_SAFE_INTEGER;
          this.logger.warn(
            "Telegram polling was disabled for this instance after 409 conflict. Restart the instance to retry."
          );
        }
        void this.demoteFromLeadership("polling conflict");
        return;
      }

      this.logger.error(`Telegram polling error: ${String(error?.message || error)}`);
    });
  }

  private startLeadershipLoop() {
    if (this.leadershipTimer || !this.token) {
      return;
    }

    this.leadershipTimer = setInterval(() => {
      void this.ensureLeadership();
    }, this.acquireIntervalMs);
  }

  private async ensureLeadership() {
    if (!this.bot || this.isShuttingDown) {
      return;
    }

    if (Date.now() < this.conflictCooldownUntil) {
      return;
    }

    const acquired = await this.acquireOrRenewLease();
    if (acquired) {
      if (!this.isLeader) {
        this.isLeader = true;
        this.logger.log(`Telegram polling leadership acquired by ${this.instanceId}`);
      }

      await this.startPolling();
      return;
    }

    if (this.isLeader || this.isPolling) {
      await this.demoteFromLeadership("lease lost");
    }
  }

  private async acquireOrRenewLease(): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + this.leaseMs);

    try {
      const lock = await this.telegramBotLockModel.findOneAndUpdate(
        {
          key: this.lockKey,
          $or: [{ leaseUntil: { $lte: now } }, { ownerId: this.instanceId }],
        },
        {
          $set: {
            ownerId: this.instanceId,
            leaseUntil,
            lastHeartbeatAt: now,
          },
          $setOnInsert: {
            key: this.lockKey,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      return lock?.ownerId === this.instanceId;
    } catch (error: any) {
      if (error?.code === 11000) {
        return false;
      }

      this.logger.warn(`Failed to acquire Telegram polling lease: ${String(error)}`);
      return false;
    }
  }

  private async releaseLeadership() {
    if (!this.isLeader) {
      return;
    }

    try {
      await this.telegramBotLockModel.deleteOne({
        key: this.lockKey,
        ownerId: this.instanceId,
      });
    } catch (error) {
      this.logger.warn(`Failed to release Telegram polling lease: ${String(error)}`);
    } finally {
      this.isLeader = false;
    }
  }

  private async demoteFromLeadership(reason: string) {
    await this.stopPolling(reason);
    await this.releaseLeadership();
  }

  private async startPolling() {
    if (!this.bot || this.isPolling) {
      return;
    }

    if (this.pollingStartPromise) {
      await this.pollingStartPromise;
      return;
    }

    this.pollingStartPromise = (async () => {
      try {
        await this.bot.startPolling();
        this.isPolling = true;
        this.logger.log(`Telegram polling started on ${this.instanceId}`);
      } catch (error) {
        this.logger.error(`Failed to start Telegram polling: ${String(error)}`);
      } finally {
        this.pollingStartPromise = null;
      }
    })();

    await this.pollingStartPromise;
  }

  private async stopPolling(reason: string) {
    if (!this.bot || !this.isPolling) {
      return;
    }

    if (this.pollingStopPromise) {
      await this.pollingStopPromise;
      return;
    }

    this.pollingStopPromise = (async () => {
      try {
        await this.bot.stopPolling();
        this.logger.log(`Telegram polling stopped (${reason})`);
      } catch (error) {
        this.logger.warn(`Failed to stop Telegram polling cleanly: ${String(error)}`);
      } finally {
        this.isPolling = false;
        this.pollingStopPromise = null;
      }
    })();

    await this.pollingStopPromise;
  }

  async checkUserSubscribe(msg: any, startPayload = "") {
    if (!this.bot) {
      this.logger.warn("Telegram bot is not initialized.");
      return;
    }

    const userId = msg.chat.id;
    const mode = startPayload === "connect" ? "connect" : "invite";
    const userData = {
      userId: userId,
      username: msg.chat.username,
      firstName: msg.chat?.first_name || "",
      lastName: msg.chat?.last_name || "",
    };
   
    const redirectLink: string = `${this.FRONT_URL}/auth/telegram?username=${encodeURIComponent(
      userData?.username || ""
    )}&name=${encodeURIComponent(
      `${userData?.firstName || ""}_${userData?.lastName || ""}`
    )}&telegramId=${encodeURIComponent(String(userId))}&mode=connect&status=success`;
    const activateHtml = `
    Success! Your activation link.
    
  <a href="${redirectLink}">${redirectLink}</a>
      `;

    await this.bot.sendMessage(userId, activateHtml, {
      parse_mode: "HTML",
    });
  }

  async sendMessageToUser(id: string, message: MessageTelegramDto) {
    const messageHTML = `
    <b>FOMO Support: ${message.title}</b>
${message.message}
      `;
    await this.bot.sendMessage(`${id}`, messageHTML, { parse_mode: "HTML" });

    if (message.file) {
      await this.bot.sendPhoto(`${id}`, message.file.buffer);
    }
  }

  async sendAnalyticsResults(
    id: string,
    message: string,
    projectName: string
  ): Promise<{ success: boolean }> {
    const messageHTML = `
    <b>FOMO AI Analytics results</b>
<b>Project: ${projectName}</b>
${message}
      `;
    await this.bot.sendMessage(`${id}`, messageHTML, { parse_mode: "HTML" });

    return { success: true };
  }

  async sendNotification(
    id: string,
    projectName: string,
    link: string
  ): Promise<{ success: boolean }> {
    const messageHTML = `
    <b>FOMO Notification</b>
The project <b>${projectName}</b> has been updated, you can see it at the link
<a href="${link}">${projectName}</a>
      `;
    await this.bot.sendMessage(`${id}`, messageHTML, { parse_mode: "HTML" });

    return { success: true };
  }
}
