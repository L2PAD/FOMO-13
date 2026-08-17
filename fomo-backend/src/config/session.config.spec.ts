import Redis from "ioredis";
import { createSessionMiddleware } from "./session.config";

jest.mock("ioredis", () =>
  ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
    })),
  }),
);

describe("session config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows memory store only outside production", async () => {
    const config = createSessionMiddleware({
      SESSION_SECRET: "test-secret",
      NODE_ENV: "development",
    } as any);

    expect(config.usingRedisStore).toBe(false);
    expect(typeof config.middleware).toBe("function");
    await expect(config.close()).resolves.toBeUndefined();
  });

  it("requires Redis-backed session store in production", () => {
    expect(() =>
      createSessionMiddleware({
        SESSION_SECRET: "test-secret",
        NODE_ENV: "production",
      } as any),
    ).toThrow(/Production sessions require/);
  });

  it("uses Redis store in production when Redis env is configured", async () => {
    const config = createSessionMiddleware({
      SESSION_SECRET: "test-secret",
      NODE_ENV: "production",
      REDIS_URL: "redis://example:6379",
    } as any);

    expect(config.usingRedisStore).toBe(true);
    expect(Redis).toHaveBeenCalledWith(
      "redis://example:6379",
      expect.objectContaining({
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      }),
    );
    const redisMock = Redis as unknown as jest.Mock;
    expect(redisMock.mock.results[0].value.on).toHaveBeenCalledWith("error", expect.any(Function));
    await expect(config.close()).resolves.toBeUndefined();
  });

  it("requires SESSION_SECRET", () => {
    expect(() => createSessionMiddleware({ NODE_ENV: "production", REDIS_URL: "redis://example:6379" } as any)).toThrow(
      /SESSION_SECRET/,
    );
  });
});
