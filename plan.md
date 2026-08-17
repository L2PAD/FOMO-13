# plan.md — EPIC NEWS-1 Continuation (FOMO-12)

## 1) Objectives
- ✅ **Закрыть формальную runtime-приёмку Phase 2** (CRM News Control Center + parser runtime) пакетами **A–E** без одного «монолитного» теста; собрать доказательства (curl/БД/рестарты/UI).
- ✅ **Устранить критический разрыв end-to-end** raw→News→public EN: исправить импортёр `news_articles → News`, чтобы свежие статьи гарантированно доходили до сайта.
- ✅ **Выполнить Phase 3 (migration parity) по AI News Synthesis** на базе донорской логики FOMO-DATA, заменив только инфраструктуру вызовов LLM на **`FomoAiGateway` + managed credentials** (без новых клиентов/ключей), с жёсткой идемпотентностью и COGS tracking.
- ▶️ **Довести Phase 3 до продуктовой готовности:**
  - улучшить public website EN (богатая карточка/страница новости),
  - добавить Bull/Redis очередь + retries/backoff + scheduler trigger для AI,
  - подготовить основу для Phase 4 (модерация/публикация).
- Далее: **Phase 4** (модерация/публикация) → **Phase 5** (Full Update/calendar/audit).

## 2) Implementation Steps (phased)

### Phase 1 — Core POC/Isolation (AI Integration) + Acceptance Preparation
> В исходном плане это была подготовка к Phase 2/3. По факту: Phase 2 acceptance закрыт, а Phase 3 parity/POC выполнены.

**User stories (Phase 1)**
1. Как админ, я хочу прогнать пакеты A–E тестов независимо, чтобы не упираться в таймаут.
2. Как админ, я хочу иметь воспроизводимые curl-команды/запросы к БД как доказательства приёмки.
3. Как система, я хочу переживать рестарт backend/Redis без зависших RUNNING-статусов.
4. Как разработчик, я хочу минимальный POC вызова `FomoAiGateway`, чтобы подтвердить managed credential и учёт COGS.
5. Как владелец продукта, я хочу чёткую parity-карту FOMO-DATA→FOMO-12 до начала миграции.

**Steps (обновлено по факту)**
1. ✅ Зафиксирован baseline: login, overview, sources(121), parsing(redisOk), diagnostics, runs, public `/api/news/crypto`.
2. ✅ Приёмка Phase 2 разбита на пакеты A–E и выполнена комбинированно (curl/БД/рестарты/testing_agent).
3. ✅ В ходе приёмки найден и исправлен критический баг импортёра raw→News (см. Phase 2 Deliverables).
4. ✅ Составлена parity-карта Phase 3: `/app/memory/NEWS1_PHASE3_PARITY.md`.

---

### Phase 2 — Phase 2 Runtime Acceptance (A–E) (combined testing-agent + manual)

**User stories (Phase 2)**
1. Как модератор, я хочу запускать/testить один источник, не имея прав на глобальные операции.
2. Как админ, я хочу ставить на паузу/возобновлять глобальный парсинг и видеть это в UI.
3. Как админ, я хочу видеть circuit breaker источника и причину ошибок.
4. Как оператор, я хочу видеть queue depth/active/completed и диагностику Redis/heartbeat.
5. Как пользователь сайта, я хочу видеть реальные новости на EN сайте после ingestion/import.

**Package A — Source lifecycle** (✅ PASS)
- Run source (manual) → Run record создаётся → status SUCCESS/PARTIAL/FAILED, поля fetched/new/duplicates.
- Test source (dry) → ничего не пишется в `news_articles`.
- Pause/resume source → корректные статусы + human state в UI.
- Error + circuit breaker: bad feedUrl → 5 подряд FAIL → source.status=ERROR; восстановление feedUrl → SUCCESS → ACTIVE, failures=0.

**Package B — Scheduler & queue + permissions** (✅ PASS)
- Run tier / run all: только admin; moderator получает 403.
- Global pause/resume: только admin; доказано, что pause блокирует scheduler tick, resume возобновляет.
- Queue state: waiting/active/delayed/failed; processor изолирует ошибки на уровне источника.

**Package C — Reliability (manual restarts)** (✅ PASS)
- Backend restart: зависшие RUNNING → авто-recovery в FAILED/ABANDONED; система продолжает работать.
- Redis restart: redisOk восстанавливается; queue/worker снова функционируют.
- Stuck jobs: авто-recovery по maxAgeMinutes.
- Idempotency/duplicates: повторные runs → dup↑, new≈0, дублей в `news_articles` не создаётся.

**Package D — UI (testing-agent frontend + API)** (✅ PASS)
- Обзор/Источники/Парсинг/Запуски/Статистика/Диагностика: вкладки грузятся, переключаются без ошибок; данные реальные.

**Package E — End-to-end** (✅ PASS, после фикса импортёра)
- Source run → raw `news_articles` появился (Mongo `fomo_market.news_articles`).
- Importer создаёт canonical `News` (Mongo `fomo_dev.news`).
- Public endpoint `/api/news/crypto` отдаёт свежие новости (newest-first).
- Website EN отображает реальные статьи.

**Deliverables (обновлено по факту)**
- ✅ Короткий отчёт по A–E: все пакеты PASS, доказательства получены.
- ✅ Критический баг импортёра исправлен:
  - **Root cause:** сортировка по `published_at` (RFC-822 string) выполнялась лексикографически → свежие статьи не попадали в top-30.
  - **Fix:** импорт выбирает raw по `_id: -1` и идемпотентно помечает `ingest_status` (`imported`/`invalid`).
  - **Ops endpoint:** `POST /api/admin/news-parser/import/backfill?batches=N` (admin) для дренажа backlog.
  - **Результат:** `News` вырос **139 → 927+**; свежие статьи видны в `/api/news/crypto`.
- ⚠️ Non-blocking: ~17 источников в ERROR (GEO_BLOCKED/DEAD/RATE_LIMITED) — **не отключать массово**, классифицировать позже.

**Build note (важно)**
- `fomo_nest` запускается как `node dist/main.js` (supervisor). Любые изменения backend `src/*` требуют: `cd /app/fomo-backend && yarn build` + `supervisorctl restart fomo_nest`.

---

### Phase 3 — AI News Synthesis (strict FOMO-DATA parity via FomoAiGateway)

**Decision rule (фиксируется как правило работ)**
- Есть в FOMO-DATA → **MIGRATE / ADAPT**
- Есть, но сломано/несовместимо → **FIX / EXTEND**
- Реально отсутствует → **BUILD**

**New context (Phase 3 donor availability)**
- Донор FOMO-DATA доступен локально: **`/tmp/FOMO-DATA`**, включая:
  - `/tmp/FOMO-DATA/backend/src/modules/news-intelligence/*` (extract/normalize/cluster/rank/synthesis)
  - `/tmp/FOMO-DATA/backend/src/modules/news/*` (fetcher/sources/sync — уже учтено в Phase 1/2)

**User stories (Phase 3)**
1. Как редактор, я хочу получать AI-синтезированные новости из реальных raw-статей, агрегируя 3–5 источников на событие.
2. Как финконтроль, я хочу видеть provider/model/tokens/cost (COGS) для каждой генерации.
3. Как оператор, я хочу чтобы ingestion/parser-run оставался SUCCESS даже если AI упал.
4. Как админ, я хочу retry генерации без дублей (строгая идемпотентность/revisions).
5. Как аудит, я хочу provenance: какие raw-статьи легли в основу AI-новости.

**Status (обновлено по факту — выполнено)**
- ✅ Managed credential активирован **существующей** механикой ENV→MANAGED:
  - `POST /api/admin/entitlements/ai/provider-credentials/migrate-env` → EMERGENT credential создан и активирован
  - testConnection SUCCESS; activeProvider=`emergent`; default модель фактически работает `gpt-4.1-mini`.
- ✅ Seed AiCreditRule: `fomo_dev.ai_credit_rules.operationType='news_synthesize'`, modelClass=`FAST` (модель определяется policy, не хардкод).
- ✅ Backend Phase 3 модуль реализован: `src/news-ai/*` + endpoints `admin/news-ai/*`.
  - MIGRATE: extractor/clustering/ranking/prompts — перенесены из FOMO-DATA (семантика сохранена).
  - ADAPT: normalizer (alias-map + slug fallback, без донорских DB lookup на этой итерации).
  - ADAPT: summary/story теперь основаны на **aggregated cluster context** (3–5 статей), чтобы «новость была больше/богаче».
  - LLM: только через **FomoAiGateway** (`billingContext=SYSTEM`), idempotency via `idempotencyKey`.
  - Данные: `generated_news`, `news_ai_runs` (fomo_market), COGS/usage: `fomo_dev.ai_usage_events`.
- ✅ Live acceptance PASS (реальный провайдер, полный trace):
  - raw article IDs → selected/grouped cluster → generation fingerprint → 8 gateway requestIds → credentialId → provider/model → tokens → providerCostUsd → creditsCharged=0 → draft → provenance.
  - Idempotency: 5 parallel jobs → 1 canonical draft + 8 usage events (не 40).
  - Negative: preflight fail при `activeProvider=mock` → retryable FAILED, нет draft, нет mock-ивентов (не «отравляет» idempotency).
  - Ingestion isolation: parser SUCCESS независимо от AI outcome.

**Frontend (обновлено по факту — выполнено)**
- ✅ CRM вкладка **«AI-генерация»** реализована в `NewsControlCenter` в текущих design tokens:
  - KPI: drafts/runs/COGS/tokens
  - контрол: windowLimit/maxClusters + кнопка запуска (admin-only)
  - таблица черновиков + детальная панель (Trace/COGS/Provenance)
  - таблица запусков генерации
  - подтверждено скриншотами и проверкой рендера.

**Remaining work (Phase 3 hardening / productization)**
1. **Public website EN — richer news detail layout**:
   - расширить карточку/страницу новости (текст, структура, provenance), использовать `extended_en`/`ai_view_en` (после publish в Phase 4 — либо временно read-only preview).
2. **Bull/Redis очередь для AI**:
   - вынести `generate()` в `news-ai` queue (retries/backoff, concurrency, circuit-breaker по провайдеру), строгая идемпотентность сохранить.
3. **Scheduler trigger**:
   - по расписанию (staggered) запускать генерацию ограниченно (например, maxClusters=1–3, windowLimit=150), с бюджет-гвардами.
4. **Provenance/COGS UX**:
   - в CRM добавить фильтры/поиск по источникам/стоимости/модели, экспорт trace.

---

### Phase 4 — Moderation & Publication lifecycle

**User stories (Phase 4)**
1. Как модератор, я хочу видеть AI-draft и решать publish/reject.
2. Как админ, я хочу политики auto-publish/AI-review/manual-review.
3. Как аудит, я хочу историю ревизий и кто что опубликовал.
4. Как сайт, я хочу показывать только опубликованные EN новости.
5. Как оператор, я хочу отличать ingestion health от AI/moderation health.

**Steps (обновлено)**
1. Ввести lifecycle для GeneratedNews: `draft → in_review → published/rejected` (publication trust green/yellow/red отдельно от entity flags).
2. Реализовать publish: GeneratedNews(EN) → canonical `News` (EN website), сохранить provenance и trace.
3. CRM вкладка «Модерация» (RU): список черновиков, просмотр, approve/reject, политика автопубликации.

---

### Phase 5 — Full Update + Calendar linkage + Audit

**User stories (Phase 5)**
1. Как редактор, я хочу запускать Full Update строго по старому поведению.
2. Как система, я хочу привязывать кандидаты-события к календарю.
3. Как аудит, я хочу трассировку: raw → cluster → generation → publish.
4. Как админ, я хочу отчёты по источникам/качеству/COGS.
5. Как оператор, я хочу диагностировать GEO_BLOCKED/DEAD/RATE_LIMITED без массового отключения.

**Steps**
1. Найти и зафиксировать точную семантику Full Update в доноре/истории (не переизобретать) → перенести.
2. Calendar hook: сохранять кандидаты событий и связывать с календарём.
3. Audit trail: единая трассировка по correlationId/idempotencyKey (ingestion → AI → moderation → publish).
4. Source cleanup diagnostics: классификация причин ошибок без массового disable.

## 3) Next Actions (immediate)
1. ✅ Phase 2 acceptance пакеты **A–E** — завершено.
2. ✅ Phase 3 parity map + backend + managed credential + live acceptance — завершено.
3. ▶️ Phase 3 hardening:
   - внедрить Bull/Redis очередь для генерации + retries/backoff,
   - добавить scheduler trigger с лимитами ресурсов,
   - улучшить public website EN (богатая новость/страница).
4. ▶️ Начать Phase 4: модерация и публикация GeneratedNews → canonical News.

## 4) Success Criteria
- ✅ Phase 2: все пакеты **A–E** пройдены; рестарты не ломают систему; идемпотентность/дедуп подтверждены; UI работает.
- ✅ End-to-end: raw→News→public EN работает; импортёр корректно выбирает свежие статьи и идемпотентно помечает обработанные.
- ✅ Phase 3 (migration parity):
  - генерация через **FomoAiGateway** (managed credential),
  - полный trace (raw IDs→cluster→fingerprint→requestId→credentialId→provider/model→tokens→COGS→draft→provenance),
  - COGS в `ai_usage_events`, creditsCharged=0,
  - идемпотентность: 5 parallel jobs → 1 canonical draft, без мульти-биллинга,
  - негативный сценарий: provider не real → FAILED retryable, без mock/fake контента, parser SUCCESS.
- Phase 3 productization: AI генерация управляется очередью/планировщиком и лимитами; public EN UI богаче.
- Phase 4/5: модерация и Full Update реализованы без переизобретения старой семантики; сайт остаётся EN, CRM RU, без параллельного движка.
