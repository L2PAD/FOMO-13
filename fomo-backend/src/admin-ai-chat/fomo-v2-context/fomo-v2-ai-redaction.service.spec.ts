import { FomoV2AiRedactionService } from "./fomo-v2-ai-redaction.service";

describe("FomoV2AiRedactionService", () => {
  it("redacts sensitive fields and omits raw payload fields", () => {
    const service = new FomoV2AiRedactionService();
    const result = service.redact({
      password: "pass",
      hash: "hash",
      token: "token",
      accessToken: "access",
      refreshToken: "refresh",
      secret: "secret",
      apiKey: "api",
      privateKey: "private",
      session: "session",
      cookie: "cookie",
      twoFactorSecret: "2fa",
      rawPayload: { nested: "payload" },
      request: { headers: { authorization: "Bearer abc" } },
      response: { body: "large response" },
      html: "<html>raw</html>",
      body: "raw body",
      safe: "visible",
    }) as Record<string, unknown>;

    [
      "password",
      "hash",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "apiKey",
      "privateKey",
      "session",
      "cookie",
      "twoFactorSecret",
    ].forEach((key) => {
      expect(result[key]).toBe("[REDACTED]");
    });

    ["rawPayload", "request", "response", "html", "body"].forEach((key) => {
      expect(result[key]).toBe("[OMITTED_RAW_PAYLOAD]");
    });

    expect(result.safe).toBe("visible");
  });

  it("redacts secret-like values inside strings", () => {
    const service = new FomoV2AiRedactionService();
    const result = service.redact(
      "mongodb://user:pass@host/fomo sk-abc123456789012345 Bearer abcdefghijklmnopqrstuvwxyz user@example.com 0x1234567890123456789012345678901234567890"
    );

    expect(result).toContain("mongodb://[REDACTED]");
    expect(result).toContain("[REDACTED]");
    expect(result).toContain("Bearer [REDACTED]");
    expect(result).toContain("[REDACTED_EMAIL]");
    expect(result).toContain("[REDACTED_WALLET]");
  });

  it("redacts key-value secrets and raw payload markers inside strings", () => {
    const service = new FomoV2AiRedactionService();
    const result = String(
      service.redact(
        "password=hunter2 token: abc123 jwt=eyJabc.def.ghi rawPayload={\"secret\":\"x\"} html=<html>body</html> request={\"url\":\"/admin\"} response=ok"
      )
    );

    expect(result).toContain("password=[REDACTED]");
    expect(result).toContain("token: [REDACTED]");
    expect(result).toContain("jwt=[REDACTED]");
    expect(result).toContain("rawPayload=[OMITTED_RAW_PAYLOAD]");
    expect(result).toContain("html=[OMITTED_RAW_PAYLOAD]");
    expect(result).toContain("request=[OMITTED_RAW_PAYLOAD]");
    expect(result).toContain("response=[OMITTED_RAW_PAYLOAD]");
    expect(result).not.toContain("hunter2");
    expect(result).not.toContain("abc123");
    expect(result).not.toContain("<html>body</html>");
  });
});
