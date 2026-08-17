import * as session from "express-session";
import Redis from "ioredis";
import type { RedisOptions } from "ioredis";

type SameSiteOption = boolean | "lax" | "strict" | "none";

type SessionMiddlewareConfig = {
  middleware: ReturnType<typeof session>;
  close: () => Promise<void>;
  usingRedisStore: boolean;
};

class IoredisSessionStore extends session.Store {
  constructor(
    private readonly client: Redis,
    private readonly options: { prefix: string; ttlSeconds: number },
  ) {
    super();
  }

  get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): void {
    this.client
      .get(this.key(sid))
      .then((raw) => {
        if (!raw) {
          callback(null, null);
          return;
        }

        try {
          callback(null, JSON.parse(raw));
        } catch (error) {
          callback(error);
        }
      })
      .catch((error) => callback(error));
  }

  set(sid: string, value: session.SessionData, callback?: (err?: any) => void): void {
    const ttlSeconds = this.resolveTtlSeconds(value);
    this.client
      .set(this.key(sid), JSON.stringify(value), "EX", ttlSeconds)
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    this.client
      .del(this.key(sid))
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  touch(sid: string, value: session.SessionData, callback?: () => void): void {
    const ttlSeconds = this.resolveTtlSeconds(value);
    this.client
      .expire(this.key(sid), ttlSeconds)
      .then(() => callback?.())
      .catch(() => callback?.());
  }

  private key(sid: string): string {
    return `${this.options.prefix}${sid}`;
  }

  private resolveTtlSeconds(value: session.SessionData): number {
    const maxAgeMs = Number(value?.cookie?.maxAge);
    if (Number.isFinite(maxAgeMs) && maxAgeMs > 0) {
      return Math.max(1, Math.ceil(maxAgeMs / 1000));
    }
    return this.options.ttlSeconds;
  }
}

export function createSessionMiddleware(env: NodeJS.ProcessEnv = process.env): SessionMiddlewareConfig {
  const secret = env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not defined");
  }

  const isProduction = env.NODE_ENV === "production";
  const maxAgeMs = parsePositiveInteger(env.SESSION_COOKIE_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000);
  const redisConfigured = hasRedisSessionConfig(env);
  const redisClient = redisConfigured ? createSessionRedisClient(env) : null;

  if (isProduction && !redisClient) {
    throw new Error("Production sessions require SESSION_REDIS_URL, REDIS_URL, or Redis host env vars.");
  }

  const middleware = session({
    name: env.SESSION_COOKIE_NAME || "fomo.sid",
    secret,
    store: redisClient
      ? new IoredisSessionStore(redisClient, {
          prefix: env.SESSION_REDIS_PREFIX || "sess:",
          ttlSeconds: Math.ceil(maxAgeMs / 1000),
        })
      : undefined,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction || env.SESSION_COOKIE_SECURE === "true",
      sameSite: parseSameSite(env.SESSION_COOKIE_SAMESITE || "lax"),
      maxAge: maxAgeMs,
    },
  });

  return {
    middleware,
    usingRedisStore: Boolean(redisClient),
    close: async () => {
      if (redisClient) {
        await redisClient.quit().catch(() => redisClient.disconnect());
      }
    },
  };
}

function createSessionRedisClient(env: NodeJS.ProcessEnv): Redis {
  const redisUrl = env.SESSION_REDIS_URL || env.REDIS_URL || env.CACHE_REDIS_URL || env.BULL_REDIS_URL;
  const options: RedisOptions = {
    lazyConnect: false,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: parsePositiveInteger(env.SESSION_REDIS_CONNECT_TIMEOUT_MS, 5000),
  };

  if (redisUrl) {
    return attachSessionRedisErrorLogger(new Redis(redisUrl, options));
  }

  return attachSessionRedisErrorLogger(
    new Redis({
      ...options,
      host: env.SESSION_REDIS_HOST || env.REDIS_HOST || env.CACHE_REDIS_HOST || env.BULL_REDIS_HOST || "127.0.0.1",
      port: parsePositiveInteger(env.SESSION_REDIS_PORT || env.REDIS_PORT || env.CACHE_REDIS_PORT || env.BULL_REDIS_PORT, 6379),
      password: env.SESSION_REDIS_PASSWORD || env.REDIS_PASSWORD || env.CACHE_REDIS_PASSWORD || env.BULL_REDIS_PASSWORD || undefined,
      db: parseNonNegativeInteger(env.SESSION_REDIS_DB || env.REDIS_DB || env.CACHE_REDIS_DB || env.BULL_REDIS_DB, 0),
    }),
  );
}

function attachSessionRedisErrorLogger(client: Redis): Redis {
  let lastErrorLogAt = 0;

  client.on("error", (error) => {
    const now = Date.now();
    if (now - lastErrorLogAt < 60_000) return;

    lastErrorLogAt = now;
    console.warn(`Redis session store connection failed: ${error?.message || error}`);
  });

  return client;
}

function hasRedisSessionConfig(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    env.SESSION_REDIS_URL ||
      env.REDIS_URL ||
      env.CACHE_REDIS_URL ||
      env.BULL_REDIS_URL ||
      env.SESSION_REDIS_HOST ||
      env.REDIS_HOST ||
      env.CACHE_REDIS_HOST ||
      env.BULL_REDIS_HOST,
  );
}

function parseSameSite(value: string): SameSiteOption {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "none") return "none";
  if (normalized === "strict") return "strict";
  if (normalized === "false") return false;
  if (normalized === "true") return true;
  return "lax";
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
