# EPIC NEWS-1 — P0 Forensic & Capability Map

Donor: **FOMO-DATA** (github.com/FOMOwiki/FOMO-DATA) — NestJS/TS + Python.
Owner (production): **FOMO-12** (this repo, `/app`).
Rule: FOMO-DATA is a **logic donor only**. Everything lives inside FOMO-12 backend/CRM/website. No second engine, no cross-DB sync product.

## A. Where the two pipelines meet
- FOMO-DATA writes RSS articles → `fomo_market.news_articles` (flexible schema).
- FOMO-12 already **reads** `fomo_market.news_articles` via `NewsArticleSource`
  (`NEWS_ARTICLES_CONNECTION`, db `fomo_market`) and imports → our `News` collection
  through `NewsService.syncNewsFromArticlesCollection()` (deduped by externalId/sourceUrl),
  gated by env `NEWS_ARTICLES_IMPORT_ENABLED=false`.
- ⇒ Target production chain: **RSS Sources → FOMO Parser Runtime → news_articles (raw)
  → dedupe/classify → AI synthesis (FomoAiGateway) → canonical `News` → Buzz→News (EN website)**.

## B. Capability map (Decision)
| Capability | FOMO-DATA | FOMO-12 | Decision |
|---|---|---|---|
| RSS fetch (rss-parser, html clean, image, content_hash) | YES (`news-fetcher.service.ts`) | NO (`rss-parser` dep missing) | **MIGRATE** into fomo-backend |
| Source registry (A/B/C, lang, weight, interval, official, active) | YES in-code array (~90 src) `news-sources.config.ts` | NO | **MIGRATE → DB collection `news_sources` (managed entity)** (P1) |
| Sync/store to news_articles + per-source status/stats | YES (`news-sync.service.ts`) | partial (only importer) | **MIGRATE** |
| Parser lifecycle: global control, per-parser config, Run entity, statuses, leases, idempotency, recovery, heartbeat, manual+scheduled | thin (console logs) | **STRONG** `fomo-v2/domains/parser-control` (`FomoV2ParserControlService`, `FOMO_V2_MANAGED_PARSERS`, Run status machine) | **REUSE PATTERN / EXTEND** (P3–P5) |
| Queue/scheduler infra | none canonical | **Bull + ioredis + @nestjs/schedule + cron** (market-sync-queue/scheduler/processor is the canonical pattern) | **REUSE** (P3) |
| Dedupe (url/externalId/content_hash + normalized title) | url+content_hash; importer also externalId/sourceUrl | partial | **BEST-OF (extend)** (P9) |
| Clustering / events (entity extract → normalize → cluster → rank → news_events/news_clusters) | YES (`news-intelligence/*`) | NO | **MIGRATE** (P10, provenance P11) |
| AI synthesis (bilingual EN/RU: headline/summary/story/ai_view, event_type, assets, entities, sources, cover img) | YES (`story-synthesizer.service.ts`, OpenAI primary / Emergent fallback via python wrapper) | NO (but has **FomoAiGateway** single managed entry + COGS + AiUsageEvent + model classes) | **MIGRATE PROMPTS/STAGES, route through FomoAiGateway** (P12–P16). NO new OpenAI client/key. |
| Managed AI credentials (Settings→AI) | env keys | **YES** `entitlements/models/ai-provider-credential.model.ts` + `FomoAiGateway` | **REUSE** (P12) |
| News canonical model | flexible | **YES** `News` (title/date/text/image/page/status/sourceUrl/externalId/sourceId/sourceName/contentHash/language/tags/author/newsSection/views/likes) | **KEEP/EXTEND** |
| News website (EN) | NO | **YES** website_front `components/layouts/projects/News/*` (+ FeedGate, FOMO Updates) | **KEEP, feed real data** (P35–P36) |
| CRM news UI | partial | **YES** Buzz→Новости (Articles + `ParcingTab`) + `buzz_ai_settings` | **EXTEND into News Control Center** (P20) |
| Comments / Topics / Calendar / Buzz | NO | **YES** | **KEEP, integrate; no regressions** (P37/P38/P56) |

## C. Canonical entities to model (managed, not code arrays)
- `NewsSource` (P1): id/name/slug/sourceType(RSS|HTML|API|CUSTOM)/url/feedUrl/language/tier(A|B|C)/
  categories[]/status(ACTIVE|PAUSED|ERROR|DISABLED)/parserKey/parserVersion/pollingIntervalMinutes/
  timeoutMs/maxRetries/rateLimitPerMinute/aiEnabled/trustLevel/priority/lastRunAt/lastSuccessAt/
  lastArticleAt/consecutiveFailures/lastError/createdAt/updatedAt.
- `NewsParserRun` (P5): sourceId/startedAt/finishedAt/status/fetched/parsed/new/duplicates/rejected/
  failed/durationMs/httpStatus/retryCount/errorCode/errorMessage/workerId/correlationId.
- `NewsArticleRaw` (P8): sourceId/externalId/canonicalUrl/originalTitle/originalBody/author/publishedAt/
  fetchedAt/imageUrl/originalLanguage/categories[]/tags[]/rawHash/contentHash/parserVersion/ingestStatus.
  (Persisted into `fomo_market.news_articles` to stay compatible with existing reader.)
- `NewsCluster` (P10) + provenance sourceArticleIds/sourceUrls (P11).
- `GeneratedNews` (P16): title/summary/body/keyPoints[]/category/topics[]/sentiment/importance/
  relatedEntities[]/sourceArticleIds[]/generatedBy/provider/model/generationRunId/reviewStatus →
  published into canonical `News` (EN) with provenance retained.

## D. Hard rules honored
- Website EN, CRM RU. Reuse design: PageHeader, underline tabs, AdminSelect, tables, green `#04A584`.
- AI only via `FomoAiGateway` + active managed provider (Settings→AI). No new key/client in news.
- Reuse Bull/Redis/@nestjs/schedule + parser-control lifecycle pattern. No parallel scheduler.
- Ingestion success is independent from AI success (P42): raw saved even if AI fails.
- No demo/seed news in production; explicit `dataMode=demo` only (P47/P57).

## E. Flags (green/yellow/red) — needs semantic confirmation (P19)
- Existing flags live in `fomo-v2/domains/flags` (entity flags green=advantage/yellow=suspicion/red=fraud),
  public submit → pending → admin confirm/reject. This is ENTITY (project) flagging, NOT news trust.
  Decision: for News moderation use a **publication trust** mapping GREEN=trusted/auto, YELLOW=needs review,
  RED=rejected/suspicious — kept SEPARATE from entity flags to avoid overloading existing semantics.

## F. CRM News Control Center tabs (P20) — under Контент → Новости
Обзор | Новости | Парсинг | Источники | Запуски | AI-генерация | Модерация | Статистика | Диагностика

---

## STATUS — Phase 1 (backbone) COMPLETE & VERIFIED with real data
Implemented in `fomo-backend/src/news-parser/` (reuses NewsService importer, Bull queue, NEWS_ARTICLES_CONNECTION):
- `news-sources.catalog.ts` (donor) → seeded **121 managed `NewsSource`** docs (A/B/C, EN+RU) into `fomo_market.news_sources`.
- `NewsFetcherService` — rss-parser fetch + HTML clean + image/canonical-url + content_hash/normalized_title, timeout + exp-backoff retry (P6).
- `NewsParserService` — registry CRUD, runSource (fetch→multi-layer dedupe→persist `news_articles`→import to `News` via existing `syncNewsFromArticlesCollection`), circuit breaker (5 fails→ERROR, P7), per-source stats, overview/health/needs-attention, 7d stats, testSource (P34), global pause (P26).
- `NewsParserRun` model + history (P5/P24). `NewsParserProcessor` (Bull, concurrency 4, per-source isolation P42). `NewsParserScheduler` (self-contained setInterval, staggered per-source nextRunAt — independent of global CRON).
- Controller `/api/admin/news-parser/*` (Roles admin,moderator + JwtAuthGuard): overview, stats, global pause/resume, sources CRUD, run/pause/resume/test, run tier/all, runs history.
- Env: `NEWS_PARSER_SCHEDULER_ENABLED=true`, `NEWS_PARSER_WORKER_ENABLED=true`, `NEWS_ARTICLES_IMPORT_ENABLED=true`.

**Verified (real data):** 121 sources seeded → 85+ runs (47 SUCCESS / 49 FAILED-isolated) → **706 real articles** in `news_articles` → **122 canonical `News`** (active/default) → public API `/api/news/crypto` total 132 → website **Buzz→News EN** renders real articles (Decrypt/OpenAI/XRP) with images+categories.

## NEXT (Phase 2+) — not yet built

## STATUS — Phase 2 (CRM News Control Center) COMPLETE & VERIFIED
Backend (added to `news-parser.service`/controller): `GET parsing` (scheduler/queue depth/workers/redis), `GET diagnostics` (functional checks: queue, registry, raw, importer, scheduler heartbeat), `GET sources` now returns human `state` + freshness + uniquenessPct, `GET sources/:id/health` (recent runs, latency p50/p95, circuit-breaker), scheduler heartbeat, freshness = max(interval×2, tierThreshold). Destructive/global ops (global pause/resume, run all/tier, source create/edit/delete, seed) gated to **admin** (moderator = view + run/test single source) — P51.
Frontend: `frontend/src/components/layouts/news_layout/NewsControlCenter.tsx` mounted under **Контент → Новости** (`/admin/content/news`). Internal header (green #04A584): Обзор · Новости · Источники · Парсинг · Запуски · AI-генерация · Модерация · Статистика · Диагностика. Human statuses (Работает/Есть проблемы/Ошибка/На паузе/Устарели данные/Не настроено). Overview = System Health (8) + Needs Attention + KPI; Источники operational table + row actions + health drawer; Парсинг global controls + queue + Run Tier/All (queue-only); Запуски history + trace drawer; Статистика recharts (fetched/unique/dup, top sources); Диагностика functional test button. AI-генерация & Модерация present in nav as Phase 3/4 placeholders (IA не переделывать).
Verified: all endpoints 200 with real data (121 sources, 910 articles, 232 runs, successRate 41%), admin compiles, Overview renders real health + needs-attention.
Pending verification: full testing_agent runtime pack (run→queued→success, pause/resume, global pause, restart recovery) — recommended next.

### Old Phase 2 line (done):
- Phase 3: clustering + provenance + AI synthesis via FomoAiGateway (classify/cluster/synthesis/translate) → GeneratedNews.
- Phase 4: moderation (green/yellow/red publication trust) + publish lifecycle + website regression.
- Phase 5: Full Update pipeline + calendar linkage + audit + permissions + acceptance.
