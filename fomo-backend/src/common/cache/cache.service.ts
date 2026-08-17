import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { RedisOptions } from "ioredis";
import { CACHE_KEY_PREFIX } from "./cache.constants";

type CacheWrapOptions<T> = {
  key: string;
  ttl: number;
  factory: () => Promise<T>;
};

@Injectable()
export class AppCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly prefix: string;
  private readonly debugLogs: boolean;
  private readonly enabled: boolean;
  private client?: Redis;
  private lastErrorLogAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.prefix = this.configService.get<string>("CACHE_KEY_PREFIX") || CACHE_KEY_PREFIX;
    this.debugLogs = this.configService.get<string>("CACHE_DEBUG_LOGS") === "true";
    this.enabled = this.configService.get<string>("CACHE_ENABLED") !== "false";
  }

  async wrap<T>({ key, ttl, factory }: CacheWrapOptions<T>): Promise<T> {
    if (!this.enabled || ttl <= 0) return factory();

    const cached = await this.getJson<T>(key);
    if (cached !== undefined) {
      this.debug(`cache hit ${key}`);
      return cached;
    }

    this.debug(`cache miss ${key}`);
    const value = await factory();
    await this.setJson(key, value, ttl);
    return value;
  }

  async getJson<T>(key: string): Promise<T | undefined> {
    try {
      const client = await this.getReadyClient();
      if (!client) return undefined;

      const raw = await client.get(this.key(key));
      if (raw === null) return undefined;

      return JSON.parse(raw) as T;
    } catch (error) {
      await this.deleteQuietly(key);
      this.logCacheError("get", error);
      return undefined;
    }
  }

  async setJson<T>(key: string, value: T, ttl: number): Promise<void> {
    if (value === undefined) return;

    try {
      const client = await this.getReadyClient();
      if (!client) return;

      await client.set(this.key(key), JSON.stringify(value), "EX", Math.max(1, Math.trunc(ttl)));
      this.debug(`cache set ${key}`);
    } catch (error) {
      this.logCacheError("set", error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.getReadyClient();
      if (!client) return;

      await client.del(this.key(key));
    } catch (error) {
      this.logCacheError("del", error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  private key(key: string): string {
    return `${this.prefix}${key}`;
  }

  private async getReadyClient(): Promise<Redis | null> {
    if (!this.enabled) return null;

    const client = this.getClient();
    if (!client) return null;

    if (client.status === "ready") return client;

    if (client.status === "wait" || client.status === "end") {
      await client.connect();
    }

    return (client.status as string) === "ready" ? client : null;
  }

  private getClient(): Redis | null {
    if (this.client) return this.client;

    const redisUrl =
      this.configService.get<string>("CACHE_REDIS_URL") ||
      this.configService.get<string>("REDIS_URL") ||
      this.configService.get<string>("BULL_REDIS_URL");

    const options: RedisOptions = {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: Number(this.configService.get<string>("CACHE_REDIS_CONNECT_TIMEOUT_MS") || 2000),
    };

    this.client = redisUrl
      ? new Redis(redisUrl, options)
      : new Redis({
          ...options,
          host:
            this.configService.get<string>("CACHE_REDIS_HOST") ||
            this.configService.get<string>("REDIS_HOST") ||
            this.configService.get<string>("BULL_REDIS_HOST") ||
            "127.0.0.1",
          port: Number(
            this.configService.get<string>("CACHE_REDIS_PORT") ||
              this.configService.get<string>("REDIS_PORT") ||
              this.configService.get<string>("BULL_REDIS_PORT") ||
              6379,
          ),
          password:
            this.configService.get<string>("CACHE_REDIS_PASSWORD") ||
            this.configService.get<string>("REDIS_PASSWORD") ||
            this.configService.get<string>("BULL_REDIS_PASSWORD") ||
            undefined,
          db: Number(
            this.configService.get<string>("CACHE_REDIS_DB") ||
              this.configService.get<string>("REDIS_DB") ||
              this.configService.get<string>("BULL_REDIS_DB") ||
              0,
          ),
        });

    this.client.on("error", (error) => this.logCacheError("connection", error));
    return this.client;
  }

  private async deleteQuietly(key: string): Promise<void> {
    try {
      const client = await this.getReadyClient();
      if (client) await client.del(this.key(key));
    } catch (error) {
      return undefined;
    }
  }

  private debug(message: string): void {
    if (this.debugLogs) this.logger.debug(message);
  }

  private logCacheError(operation: string, error: any): void {
    const now = Date.now();
    if (now - this.lastErrorLogAt < 60_000) return;
    this.lastErrorLogAt = now;
    this.logger.warn(`Redis cache ${operation} failed: ${error?.message || error}`);
  }
}
