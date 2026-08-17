import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
const Parser = require("rss-parser");
import { NEWS_PARSER_DEFAULTS } from "./news-parser.constants";

export interface FetchedArticle {
  id: string;
  source_id: string;
  source_name: string;
  url: string;
  canonical_url: string;
  title: string;
  summary: string;
  content?: string;
  author?: string;
  published_at?: string;
  image_url?: string;
  tags: string[];
  language: string;
  content_hash: string;
  normalized_title: string;
}

export interface FetchResult {
  ok: boolean;
  itemCount: number;
  articles: FetchedArticle[];
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  latencyMs: number;
}

// Ported from FOMO-DATA news-fetcher, hardened with timeout + retry (P6).
@Injectable()
export class NewsFetcherService {
  private readonly logger = new Logger(NewsFetcherService.name);

  private makeParser(timeoutMs: number) {
    return new Parser({
      timeout: timeoutMs,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 FOMO/2.0",
      },
      maxRedirects: 5,
    });
  }

  private articleId(url: string, sourceId: string): string {
    const hash = crypto.createHash("md5").update(`${sourceId}:${url}`).digest("hex");
    return `art_${hash.slice(0, 16)}`;
  }

  private contentHash(title: string, content = ""): string {
    const text = `${title}:${(content || "").slice(0, 500)}`;
    return crypto.createHash("md5").update(text.toLowerCase()).digest("hex");
  }

  private normalizeTitle(title: string): string {
    return (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04ff ]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
  }

  private canonicalUrl(raw: string): string {
    try {
      const u = new URL(raw);
      u.hash = "";
      for (const k of Array.from(u.searchParams.keys())) {
        if (/^utm_|^ref$|^ref_|^source$|^fbclid$|^gclid$/i.test(k)) u.searchParams.delete(k);
      }
      return u.toString();
    } catch {
      return raw;
    }
  }

  private cleanHtml(html: string): string {
    if (!html) return "";
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
  }

  private extractImage(item: any): string | undefined {
    if (item["media:content"]?.url) return item["media:content"].url;
    if (item["media:thumbnail"]?.url) return item["media:thumbnail"].url;
    if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
      return item.enclosure.url;
    }
    const content = item.content || item["content:encoded"];
    if (content) {
      const m = content.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
      if (m && m[1].startsWith("http")) return m[1];
    }
    return undefined;
  }

  async fetch(
    source: { id: string; name: string; feedUrl: string; language?: string },
    opts: { limit?: number; timeoutMs?: number; maxRetries?: number } = {}
  ): Promise<FetchResult> {
    const limit = opts.limit ?? NEWS_PARSER_DEFAULTS.limit;
    const timeoutMs = opts.timeoutMs ?? NEWS_PARSER_DEFAULTS.timeoutMs;
    const maxRetries = opts.maxRetries ?? NEWS_PARSER_DEFAULTS.maxRetries;
    const start = Date.now();
    let retryCount = 0;
    let lastErr: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        retryCount++;
        await this.sleep(Math.min(500 * 2 ** (attempt - 1), 4000)); // exp backoff
      }
      try {
        const parser = this.makeParser(timeoutMs);
        const feed = await parser.parseURL(source.feedUrl);
        const items = (feed.items || []).slice(0, limit);
        const articles: FetchedArticle[] = [];
        for (const item of items) {
          if (!item.link || !item.title) continue;
          const raw =
            item.content || item["content:encoded"] || item.summary || item.description || "";
          const cleanContent = this.cleanHtml(raw);
          const canonical = this.canonicalUrl(item.link);
          articles.push({
            id: this.articleId(canonical, source.id),
            source_id: source.id,
            source_name: source.name,
            url: item.link,
            canonical_url: canonical,
            title: String(item.title).trim(),
            summary: cleanContent.slice(0, 500),
            content: cleanContent,
            author: item.creator || item.author || undefined,
            published_at: item.pubDate || item.isoDate || undefined,
            image_url: this.extractImage(item),
            tags: (item.categories || []).map((c: any) =>
              typeof c === "string" ? c : c?._ || ""
            ),
            language: source.language || "en",
            content_hash: this.contentHash(item.title, cleanContent),
            normalized_title: this.normalizeTitle(item.title),
          });
        }
        return {
          ok: true,
          itemCount: items.length,
          articles,
          retryCount,
          latencyMs: Date.now() - start,
        };
      } catch (e: any) {
        lastErr = e;
        this.logger.warn(
          `[NewsFetcher] ${source.name} attempt ${attempt + 1} failed: ${e?.message || e}`
        );
      }
    }
    return {
      ok: false,
      itemCount: 0,
      articles: [],
      retryCount,
      errorCode: lastErr?.code || "FETCH_FAILED",
      errorMessage: String(lastErr?.message || lastErr).slice(0, 500),
      latencyMs: Date.now() - start,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
