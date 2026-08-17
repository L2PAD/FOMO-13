import type { BullModuleOptions } from '@nestjs/bull';
import type { RedisOptions } from 'ioredis';

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMaxRetriesPerRequest(value: string | undefined): number | null {
  if (!value || value.toLowerCase() === 'null') {
    return null;
  }

  return parseInteger(value, 20);
}

function buildRedisCommonOptions(): RedisOptions {
  const retryBaseDelayMs = parseInteger(process.env.BULL_REDIS_RETRY_BASE_DELAY_MS, 500);
  const retryMaxDelayMs = parseInteger(process.env.BULL_REDIS_RETRY_MAX_DELAY_MS, 5000);

  return {
    enableReadyCheck: false,
    connectTimeout: parseInteger(process.env.BULL_REDIS_CONNECT_TIMEOUT_MS, 10000),
    maxRetriesPerRequest: parseMaxRetriesPerRequest(process.env.BULL_REDIS_MAX_RETRIES_PER_REQUEST),
    retryStrategy: (times: number) => Math.min(times * retryBaseDelayMs, retryMaxDelayMs),
  };
}

export function getBullModuleOptions(): BullModuleOptions {
  const redisUrl = process.env.BULL_REDIS_URL || process.env.REDIS_URL;
  const redis: RedisOptions = redisUrl
    ? buildRedisCommonOptions()
    : {
        ...buildRedisCommonOptions(),
        host: process.env.BULL_REDIS_HOST || process.env.REDIS_HOST || '127.0.0.1',
        port: parseInteger(process.env.BULL_REDIS_PORT || process.env.REDIS_PORT, 6379),
        password: process.env.BULL_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
        db: parseInteger(process.env.BULL_REDIS_DB || process.env.REDIS_DB, 0),
      };
  const prefix = process.env.BULL_QUEUE_PREFIX;

  return {
    ...(redisUrl ? { url: redisUrl } : {}),
    ...(prefix ? { prefix } : {}),
    redis,
  };
}
