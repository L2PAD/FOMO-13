import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const DISABLED_VALUES = ["false", "0", "off", "no"];
const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_TIMEOUT_MS = 10000;
const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

export type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

export type TavilySearchResponse = {
  query: string;
  results: TavilySearchResult[];
  response_time?: number | string;
  request_id?: string;
};

export class WebSearchProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "WebSearchProviderError";
  }
}

@Injectable()
export class TavilyWebSearchProvider {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    const provider = this.providerName();
    const enabled = this.isEnabled();
    const hasApiKey = Boolean(this.apiKey());

    if (!enabled || !hasApiKey) {
      return {
        provider,
        enabled,
        configured: false,
        errorCode: "WEB_SEARCH_PROVIDER_NOT_CONFIGURED",
        maxResults: this.maxResults(),
        timeoutMs: this.timeoutMs(),
        officialPriority: this.officialPriority(),
      };
    }

    if (provider !== "tavily") {
      return {
        provider,
        enabled,
        configured: false,
        errorCode: "WEB_SEARCH_PROVIDER_UNSUPPORTED",
        maxResults: this.maxResults(),
        timeoutMs: this.timeoutMs(),
        officialPriority: this.officialPriority(),
      };
    }

    return {
      provider,
      enabled,
      configured: true,
      maxResults: this.maxResults(),
      timeoutMs: this.timeoutMs(),
      officialPriority: this.officialPriority(),
    };
  }

  async search(input: {
    query: string;
    limit?: number;
    includeDomains?: string[];
    searchDepth?: "basic" | "advanced";
  }): Promise<TavilySearchResponse> {
    const status = this.getStatus();
    if (!status.configured) {
      throw new WebSearchProviderError(
        status.errorCode || "WEB_SEARCH_PROVIDER_NOT_CONFIGURED",
        status.errorCode === "WEB_SEARCH_PROVIDER_UNSUPPORTED"
          ? "Configured web search provider is not supported"
          : "Web search provider is not configured"
      );
    }

    const query = String(input.query || "").trim();
    if (!query) {
      throw new WebSearchProviderError(
        "WEB_SEARCH_INPUT_REQUIRED",
        "Search query is required"
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), status.timeoutMs);

    try {
      const response = await fetch(TAVILY_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey()}`,
        },
        body: JSON.stringify({
          query,
          max_results: Math.min(
            Math.max(1, Math.floor(Number(input.limit || status.maxResults))),
            status.maxResults
          ),
          search_depth: input.searchDepth || "advanced",
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_favicon: false,
          include_domains: this.cleanDomains(input.includeDomains).slice(0, 20),
          topic: "general",
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new WebSearchProviderError(
          "WEB_SEARCH_RATE_LIMITED",
          "Tavily rate limit was reached"
        );
      }

      if (!response.ok) {
        throw new WebSearchProviderError(
          "WEB_SEARCH_PROVIDER_ERROR",
          `Tavily search failed with status ${response.status}`
        );
      }

      const data = await response.json() as TavilySearchResponse;
      return {
        query: String(data.query || query),
        results: Array.isArray(data.results) ? data.results : [],
        response_time: data.response_time,
        request_id: data.request_id,
      };
    } catch (error: any) {
      if (error instanceof WebSearchProviderError) throw error;
      if (error?.name === "AbortError") {
        throw new WebSearchProviderError(
          "WEB_SEARCH_TIMEOUT",
          "Tavily search timed out"
        );
      }
      throw new WebSearchProviderError(
        "WEB_SEARCH_PROVIDER_ERROR",
        "Tavily search provider failed"
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  maxResults() {
    const configured = Number(
      this.configService.get<string>("AI_WEB_SEARCH_MAX_RESULTS")
    );
    if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_MAX_RESULTS;
    return Math.min(Math.floor(configured), 20);
  }

  timeoutMs() {
    const configured = Number(
      this.configService.get<string>("AI_WEB_SEARCH_TIMEOUT_MS")
    );
    if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_TIMEOUT_MS;
    return Math.min(Math.floor(configured), 30000);
  }

  officialPriority() {
    const value = this.configService.get<string>(
      "AI_WEB_SEARCH_OFFICIAL_PRIORITY"
    );
    if (value === undefined || value === null || value === "") return true;
    return !DISABLED_VALUES.includes(String(value).toLowerCase());
  }

  private providerName() {
    return String(
      this.configService.get<string>("AI_WEB_SEARCH_PROVIDER") || ""
    )
      .trim()
      .toLowerCase();
  }

  private isEnabled() {
    const value = this.configService.get<string>("AI_WEB_SEARCH_ENABLED");
    if (value === undefined || value === null || value === "") return false;
    return !DISABLED_VALUES.includes(String(value).toLowerCase());
  }

  private apiKey() {
    return String(this.configService.get<string>("TAVILY_API_KEY") || "").trim();
  }

  private cleanDomains(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => String(item || "").trim().toLowerCase())
      .filter((item) => /^[a-z0-9.-]+$/.test(item))
      .slice(0, 50);
  }
}
