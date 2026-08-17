import axios from "axios";
import {
  IntelParserControlClient,
  IntelParserControlClientError,
} from "./intel-parser-control.client";

describe("IntelParserControlClient", () => {
  afterEach(() => jest.restoreAllMocks());

  it("builds the apiintel URL once, authenticates server-side and unwraps data", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "INTEL_API_BASE_URL")
          return "https://apiintel.fomo.cx/api/";
        if (key === "PARSER_CONTROL_INTERNAL_TOKEN") return "server-secret";
        return undefined;
      }),
    };
    const request = jest.spyOn(axios, "request").mockResolvedValue({
      data: {
        ok: true,
        data: { parsers: [{ parserKey: "dropstab:coin-details" }] },
      },
    } as any);
    const client = new IntelParserControlClient(config as any);

    await expect(client.listParsers()).resolves.toEqual({
      parsers: [{ parserKey: "dropstab:coin-details" }],
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://apiintel.fomo.cx/api/internal/parser-control/parsers",
        headers: expect.objectContaining({
          "x-internal-sync-token": "server-secret",
        }),
      })
    );
  });

  it("does not duplicate an already complete parser-control base path", () => {
    const client = new IntelParserControlClient({
      get: (key: string) =>
        key === "INTEL_API_BASE_URL"
          ? "https://apiintel.fomo.cx/api/internal/parser-control/"
          : "token",
    } as any);

    expect(client.baseUrl()).toBe(
      "https://apiintel.fomo.cx/api/internal/parser-control"
    );
  });

  it("fails closed when the internal token is missing", async () => {
    const client = new IntelParserControlClient({
      get: (key: string) =>
        key === "INTEL_API_BASE_URL"
          ? "https://apiintel.fomo.cx/api"
          : undefined,
    } as any);

    await expect(client.listParsers()).rejects.toMatchObject<
      Partial<IntelParserControlClientError>
    >({ code: "intel_auth_not_configured", statusCode: 503 });
  });

  it("sends a stable idempotency key when starting a remote run", async () => {
    const config = {
      get: (key: string) => {
        if (key === "INTEL_API_BASE_URL") return "https://apiintel.fomo.cx/api";
        if (key === "PARSER_CONTROL_INTERNAL_TOKEN") return "server-secret";
        return undefined;
      },
    };
    const request = jest.spyOn(axios, "request").mockResolvedValue({
      data: { ok: true, data: { runId: "remote-1" } },
    } as any);
    const client = new IntelParserControlClient(config as any);

    await client.startRun("dropstab:coin-details", {
      entityLimit: 50,
      filters: {},
      flowId: "flow-1",
      environment: "test",
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ environment: "test", entityLimit: 50 }),
        headers: expect.objectContaining({ "x-idempotency-key": "flow-1" }),
      })
    );
  });
});
