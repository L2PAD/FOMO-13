import { ConfigService } from "@nestjs/config";
import {
  TavilyWebSearchProvider,
  WebSearchProviderError,
} from "./tavily-web-search.provider";

function provider(env: Record<string, string | undefined>) {
  return new TavilyWebSearchProvider(
    new ConfigService(env as Record<string, string>)
  );
}

function mockFetch(response: Partial<Response> & { json?: () => Promise<any> }) {
  (global as any).fetch = jest.fn(async () => response);
}

describe("TavilyWebSearchProvider", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it("returns not configured when disabled or API key is missing", () => {
    expect(provider({
      AI_WEB_SEARCH_PROVIDER: "tavily",
      AI_WEB_SEARCH_ENABLED: "false",
      TAVILY_API_KEY: "tvly-test",
    }).getStatus()).toEqual(
      expect.objectContaining({
        configured: false,
        errorCode: "WEB_SEARCH_PROVIDER_NOT_CONFIGURED",
      })
    );

    expect(provider({
      AI_WEB_SEARCH_PROVIDER: "tavily",
      AI_WEB_SEARCH_ENABLED: "true",
    }).getStatus()).toEqual(
      expect.objectContaining({
        configured: false,
        errorCode: "WEB_SEARCH_PROVIDER_NOT_CONFIGURED",
      })
    );
  });

  it("returns controlled unsupported provider status", () => {
    expect(provider({
      AI_WEB_SEARCH_PROVIDER: "brave",
      AI_WEB_SEARCH_ENABLED: "true",
      TAVILY_API_KEY: "tvly-test",
    }).getStatus()).toEqual(
      expect.objectContaining({
        configured: false,
        errorCode: "WEB_SEARCH_PROVIDER_UNSUPPORTED",
      })
    );
  });

  it("calls Tavily search with safe body and no raw content", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({
        query: "Monad tokenomics",
        results: [
          {
            title: "Monad Tokenomics",
            url: "https://monad.xyz/tokenomics",
            content: "Official docs",
            score: 0.9,
            raw_content: null,
          },
        ],
      }),
    });
    const service = provider({
      AI_WEB_SEARCH_PROVIDER: "tavily",
      AI_WEB_SEARCH_ENABLED: "true",
      TAVILY_API_KEY: "tvly-secret",
      AI_WEB_SEARCH_MAX_RESULTS: "3",
      AI_WEB_SEARCH_TIMEOUT_MS: "9000",
    });

    const result = await service.search({
      query: "Monad tokenomics",
      limit: 10,
      includeDomains: ["monad.xyz"],
    });
    const [, init] = ((global as any).fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);

    expect(result.results).toHaveLength(1);
    expect(init.headers.Authorization).toBe("Bearer tvly-secret");
    expect(body).toEqual(
      expect.objectContaining({
        query: "Monad tokenomics",
        max_results: 3,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: false,
        include_images: false,
        include_domains: ["monad.xyz"],
      })
    );
  });

  it("maps provider errors to controlled error codes", async () => {
    const service = provider({
      AI_WEB_SEARCH_PROVIDER: "tavily",
      AI_WEB_SEARCH_ENABLED: "true",
      TAVILY_API_KEY: "tvly-secret",
    });

    mockFetch({ ok: false, status: 429 });
    await expect(service.search({ query: "Monad tokenomics" })).rejects.toEqual(
      expect.objectContaining({ code: "WEB_SEARCH_RATE_LIMITED" })
    );

    (global as any).fetch = jest.fn(async () => {
      const error = new Error("aborted") as Error & { name: string };
      error.name = "AbortError";
      throw error;
    });
    await expect(service.search({ query: "Monad tokenomics" })).rejects.toEqual(
      expect.objectContaining({ code: "WEB_SEARCH_TIMEOUT" })
    );

    expect(new WebSearchProviderError("X", "message").code).toBe("X");
  });
});
