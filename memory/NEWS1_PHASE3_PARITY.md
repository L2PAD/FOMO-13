# EPIC NEWS-1 — Phase 3 AI Synthesis · Migration Parity Map (FOMO-DATA → FOMO-12)

Donor source (read-only): `/tmp/FOMO-DATA/backend/src/modules/`
Owner: FOMO-12 `/app/fomo-backend`
Rule: **MIGRATE/ADAPT** if it exists in donor · **FIX/EXTEND** if broken · **BUILD** only if truly absent.
Hard mandate: every LLM call routes through **`FomoAiGateway`** (`src/entitlements/ai/fomo-ai-gateway.service.ts`) with an **active managed credential (Настройки → AI)**. NO raw OpenAI client, NO Python `llm_call.py`/`image_gen.py` wrappers, NO new keys in `.env`. Ingestion SUCCESS ≠ AI SUCCESS. No mock/fake news ever published.

## A. Donor pipeline (as-is)
`news-intelligence.service.ts` orchestrates: raw articles → **extract entities** (`extractors/entity-extractor.service`) → **normalize** to canonical IDs (`normalizers/entity-normalizer.service`) → build **NewsEvent** (with `detectEventType`) → **cluster** (`clustering/news-clustering.service`) → **rank** (`ranking/news-ranking.service`) → persist `news_events` + `news_clusters`; `processRecent(hours,limit)` selects `news_articles` where `processed != true`, marks them `processed=true` after.
`story-synthesizer.service.ts` `generateFullStory(event)`: **8 LLM calls** — HEADLINE/SUMMARY/STORY(600–690 chars)/AI_VIEW, each EN + RU — via `callLLM()` → **Python wrapper** `/app/backend/llm_call.py` (OpenAI primary, Emergent fallback). `GenerationCacheService` caches per `(eventId, component, language)` (idempotency). `unique_hash = md5(headlineEn+storyEn)` (generated-story dedupe). `CoverImageGeneratorService` → Python `image_gen.py`.

### Donor prompts (migrate verbatim)
- HEADLINE_PROMPT: ≤80 chars, professional/factual, no sensationalism, `{event_type}/{topic}/{assets}/{language}`.
- SUMMARY_PROMPT: 2–3 sentences, ≤300 chars, factual, `{headline}/{topic}/{language}`.
- STORY_PROMPT: 600–690 chars, analytical/objective, `{headline}/{summary}/{assets}/{topic}/{language}`.
- AI_VIEW_PROMPT: 2–3 sentences, ≤200 chars, starts with "FOMO AI:", `{headline}/{summary}/{assets}/{language}`.

### Donor clustering (migrate verbatim)
- Cluster key = `type:mainEntity:dateBucket(YYYY-MM-DD)`; dedupe entities/sources; `score = eventCount`.
- Merge clusters with same `type` and **Jaccard entity overlap > 0.5**; merged id `merged:type:mainEntity`.

### Donor ranking (migrate verbatim)
- `rankScore = 0.3·frequency + 0.35·recency + 0.2·sourceWeight + 0.15·entityWeight`.
- frequency = min(1, eventCount/10). recency step decay (6h=1.0 … >1w=0.25). sourceWeight from `SOURCE_WEIGHTS` map + diversity bonus. entityWeight from `TIER1_ENTITIES` set.

## B. Parity table (OLD → CURRENT → ACTION)
| Capability | FOMO-DATA (old) | FOMO-12 (current) | ACTION |
|---|---|---|---|
| Article selection window | `processRecent`: `news_articles` `processed!=true`, recent, `sort createdAt desc` | raw in `fomo_market.news_articles` (has `ingest_status`); we already sort by `_id desc` in importer | **MIGRATE/ADAPT** — select un-generated raw via new flag `ai_status`; sort `_id desc`; time window param |
| Entity extraction | `entity-extractor.service` (regex/dictionary) | none | **MIGRATE** verbatim |
| Entity normalization → canonical IDs | `entity-normalizer.service` (matches projects/funds/tokens) | FOMO-12 has canonical projects/entities; donor normalizer matches its own DB | **ADAPT** — wire to FOMO-12 canonical lookups (or keep loose match first, refine later) |
| Event type detection | `detectEventType()` keyword rules | none | **MIGRATE** verbatim |
| Story grouping / clustering | `news-clustering.service` (type:entity:date + Jaccard>0.5 merge) | none | **MIGRATE** verbatim |
| Ranking | `news-ranking.service` (freq/recency/source/entity) | none | **MIGRATE** verbatim |
| Generation prompts (EN+RU, 4 components) | `story-synthesizer` prompts | none | **MIGRATE** verbatim |
| LLM transport | Python `llm_call.py` (OpenAI/Emergent) | **`FomoAiGateway.execute()`** managed | **REPLACE infra** — swap `callLLM` → gateway (billingContext SYSTEM) |
| Provider credentials | env keys | managed `ai_global_settings` + `ai_provider_credentials` (Настройки→AI) | **REPLACE** — active managed credential only |
| Generation idempotency | `GenerationCacheService` per (event,component,lang) | gateway `idempotencyKey` (unique-claim before provider) + our cache | **MIGRATE→ADAPT** onto gateway idempotencyKey + `generated_news.unique_hash` |
| Generated-story dedupe | `unique_hash = md5(headlineEn+storyEn)` | News `contentHash` dedupe on import | **MIGRATE** unique_hash + reuse News dedupe |
| Retries/backoff | none explicit (per-call) | Bull queue (news-parser) ret/backoff pattern | **BUILD** — AI generation Bull queue w/ retries, isolated from ingestion |
| COGS / usage tracking | none | **`AiUsageEvent`** auto-written by gateway (providerCostUsd/tokens) | **REUSE** — SYSTEM billingContext logs COGS |
| Provenance (source articles) | cluster.sources / event ids | partial | **EXTEND** — persist `sourceArticleIds[] + sourceUrls[]` on GeneratedNews |
| Persistence: events/clusters | `news_events`, `news_clusters` | none | **MIGRATE** collections (fomo_market) |
| Generated → published News (EN) | `generated_news` → (manual/publish) | canonical `News` (EN site) | **ADAPT** — GeneratedNews draft → moderation (Phase 4) → publish to `News` |
| Cover image | Python `image_gen.py` | gateway image gen (gpt-image-1 / Nano Banana) | **DEFER/ADAPT** (Phase 3.5) — optional, via gateway only |
| Full Update | not found literally in donor scheduler | FOMO-12 CRM concept | **INVESTIGATE (Phase 5)** — locate exact old behavior before building |
| CRM controls | partial | News Control Center (AI-генерация placeholder) | **EXTEND** — fill AI-генерация tab (Phase 3 UI) |

## C. FomoAiGateway integration contract (verified from source)
- Call: `gateway.execute({ userId, operation, input, system?, billingContext:"SYSTEM", idempotencyKey, mode:"CHAT", modelPolicy? })`.
- Requires an **active `AiCreditRule`** (`fomo_dev.ai_credit_rules`, `{ operationType, active:true }`) else `errorCode:"unknown_operation"`. Existing rules e.g. `activity_ai_review` (STANDARD). **BUILD**: seed rule(s) for news synthesis (e.g. `news_synthesize`, modelClass STANDARD/FAST, estInput/estOutput tokens, capabilityRequired:"").
- `billingContext:"SYSTEM"` → no user credits; `AiUsageEvent` still records providerCostUsd/tokens (COGS). `userId` may be non-ObjectId (falls back to SYSTEM sentinel `000...000`).
- Idempotency: unique `idempotencyKey` claimed before provider call; duplicate → `{ok, duplicate:true}` (retry-safe).
- Response: `{ ok, content, usage:{inputTokens,outputTokens,totalTokens}, cost:{providerCostUsd,totalCostUsd,costStatus}, model, provider, dataMode:"real"|"mock", latencyMs }`.
- Provider config source: `ai_global_settings.activeProvider` (or `AI_PROVIDER`) + configured OpenAI/Emergent credential. If not configured → `ServiceUnavailableException("provider_unavailable")`. Mock only when `activeProvider="mock"`/`forceMock` (dataMode:"mock").

### ⚠️ BLOCKER for real-AI Phase 3 acceptance
`ai_global_settings`: `activeProvider=""`, `activeCredentialId=""`, no OpenAI/Emergent key in DB; `ai_provider_credentials=0`. Pricing rows exist for `openai/gpt-4.1-mini|gpt-4.1|gpt-5.5`. Env has `EMERGENT_LLM_KEY`. → A managed credential MUST be activated in **Настройки → AI** (or Emergent key wired as managed) before real generation + COGS can be proven. Until then only mock-plumbing (never published) is possible.

## D. Phase 3 target design (in FOMO-12)
- New module `src/news-ai/` (or extend `news-parser`) — keep separate from ingestion.
- Entities (fomo_market): `news_events`, `news_clusters`, `generated_news` (title_en/ru, short_en/ru, extended_en/ru, ai_view_en/ru, event_type, assets[], entities[], sourceArticleIds[], sourceUrls[], provider, model, tokens, costUsd, unique_hash, generationRunId, reviewStatus="draft", createdAt).
- `NewsAiGenerationRun` entity: { correlationId, status(RUNNING/SUCCESS/FAILED), idempotencyKey, provider, model, inputTokens, outputTokens, costUsd, error, startedAt, finishedAt, generatedCount }.
- Services (migrate donor verbatim): EntityExtractor, EntityNormalizer(adapted), Clustering, Ranking, EventTypeDetector. StorySynthesizer rewritten to call gateway (8 components) with per-component idempotencyKey `gen:{clusterId}:{component}:{lang}`.
- Bull queue `news-ai` (retries/backoff), isolated: AI failure must NOT flip parser run to FAILED; raw preserved; generation retryable.
- Admin endpoints (RU CRM, admin-gated): trigger generation (by window/cluster), list drafts, view provenance + COGS, retry. Fill "AI-генерация" tab.
- COGS surfaced from `AiUsageEvent` (SYSTEM) joined by generationRunId/idempotencyKey.

## E. Phase 3 acceptance (must prove)
Positive: real raw articles → migrated selection/grouping/ranking → `FomoAiGateway` (managed OpenAI) → real GeneratedNews draft → provenance (sourceArticleIds/urls) → tokens/COGS/provider/model recorded → parser run stays SUCCESS regardless of AI.
Negative: provider fail → raw preserved, parser NOT FAILED, generation retryable, no mock/fake news published.

---

## STATUS — Phase 3 BACKEND COMPLETE & LIVE-VERIFIED (real managed provider)
Managed credential: EMERGENT imported via existing ENV→MANAGED (`POST /admin/entitlements/ai/provider-credentials/migrate-env`) → activated → testConnection SUCCESS (provider openai via Emergent, model gpt-4.1-mini). Rule seeded: `news_synthesize` (fomo_dev.ai_credit_rules, modelClass FAST → gpt-4.1-mini, billingContext INTERNAL, model is POLICY not hardcoded).

Module `src/news-ai/` (registered in AppModule): migrated VERBATIM from FOMO-DATA — EntityExtractor, Clustering (type:mainEntity:date + Jaccard>0.5 merge), Ranking (freq/recency/source/entity), prompts (HEADLINE/SUMMARY/STORY/AI_VIEW). ADAPTED: EntityNormalizer (alias-map + slug, DB-lookups dropped for self-contained core), STORY/SUMMARY grounded on aggregated cluster source text (product req), StorySynthesizer routes 8 calls (EN+RU) through **FomoAiGateway** (billingContext SYSTEM). Dates normalized to Date (avoids the Phase-2 string-date bug class). GeneratedNews upsert by unique_hash (=md5(sorted sourceArticleIds + policyVersion)).

Endpoints (admin/moderator; generate=admin): `GET /api/admin/news-ai/overview|drafts|drafts/:hash|runs`, `POST /api/admin/news-ai/generate {windowLimit,maxClusters,minClusterSize}`.

### Acceptance trace (LIVE, real):
raw article IDs → cluster (generic:bitcoin:date, 4 sources) → fingerprint 0a9887… → 8 FomoAiGateway requestIds → managed credentialId 6a838a84… → provider openai / model gpt-4.1-mini → inputTokens 2677 / outputTokens 714 → providerCostUsd $0.0022132 → creditsCharged 0 (SYSTEM) → bilingual draft (EN 1174 / RU 1138 chars) reviewStatus=draft → provenance sourceArticleIds[4]+sourceUrls[4]. AiUsageEvents in `fomo_dev.ai_usage_events` (8, dataMode=real, COGS).
- Idempotency: sequential re-run → same 8 events (no new billable); **5 parallel jobs → 1 canonical GeneratedNews + 8 events (not 40)**.
- Negative: provider not real (activeProvider=mock) → preflight fast-fail, status FAILED, retryable=true, **no gateway call, no mock/fake draft, 0 mock events**; parser run stays SUCCESS (ingestion isolation, Parser SUCCESS ≠ AI).
- Safety: callGateway rejects dataMode=mock (never persists fabricated content).

### Phase 3 REMAINING (next)
- CRM frontend: fill "AI-генерация" tab (drafts list + detail + provenance + COGS + generate control) mirroring backend, per current design tokens.
- Public site: richer news detail layout (current is bare) — use generated extended_en/ai_view.
- Bull queue for AI generation (retries/backoff) + scheduler trigger (currently synchronous manual/endpoint).
- Publish flow GeneratedNews(draft) → moderation (Phase 4) → canonical News (EN).
