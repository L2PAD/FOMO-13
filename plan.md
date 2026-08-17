# plan.md — FOMO-10 Buzz Consolidation (UPDATED)

## 1) Objectives
- ✅ Закрыть P0: исправить 404 на экране FeedGate и превратить его в продающую конверсионную страницу.
- ✅ Вернуть публичный “FOMO Updates” вместо “Alerts” в Buzz hub (и убедиться, что это **в прод-сборке Next.js**).
- ✅ Добавить backend-эндпоинт статистики Buzz (активность, модерация, AI/COGS, 14-дневная динамика).
- ✅ Пересобрать CRM Buzz с **чистым разделением доменов** (по требованию):
  - Дашборд (метрики)
  - Новости (парсинг + материалы)
  - Feed (топики/модерация/AI)
  - Календарь (события)
  - Дайджесты (редакционные обзоры)
  - FOMO Updates (анонсы платформы)
- ✅ Провести обязательное тестирование (frontend testing_agent для FeedGate) + sanity-check backend stats.

## 2) Implementation Steps

### Phase 1 (P0) — Fix FeedGate + Conversion (COMPLETED)
**User stories (≥5)**
1. ✅ Как пользователь без доступа, я вижу объяснение ценности Feed и понимаю, что получу после покупки.
2. ✅ Как пользователь без доступа, я нажимаю “Оформить членство” и попадаю на страницу продаж без 404.
3. ✅ Как пользователь без доступа, я нажимаю “Открыть Spaceport” и попадаю в Spaceport без 404.
4. ✅ Как пользователь, я вижу список преимуществ и сильный CTA.
5. ✅ Как пользователь, я понимаю, что News/Calendar остаются бесплатными.

**Что сделано**
- ✅ Файл: `/app/website_front/components/layouts/projects/News/FeedGate/index.tsx`
- ✅ Исправлены маршруты:
  - memberships → `/utility/memberships`
  - spaceport → `/core/spaceport`
- ✅ Экран Gate переработан в конверсионный:
  - benefit grid + “Что вы получаете внутри” + “passes” (Membership/NFT)
  - 2 CTA (primary/secondary)
  - аккуратный responsive

**Testing / Evidence**
- ✅ `testing_agent` iteration_45: обе кнопки ведут на реальные страницы, 404 отсутствует.

---

### Phase 2 (P1) — Public: Alerts → FOMO Updates (COMPLETED)
**User stories (≥5)**
1. ✅ Как пользователь, я вижу вкладку “FOMO Updates” вместо “Alerts”.
2. ✅ Как пользователь, я открываю вкладку и вижу список апдейтов платформы.
3. ✅ Как пользователь, я не теряю доступ к News/Feed/Calendar.
4. ✅ Как пользователь, я вижу консистентный нейминг также на `/updates`.
5. ✅ Как пользователь, вкладка работает в прод-сборке Next.js (не «застрявший билд»).

**Что сделано**
- ✅ Файл: `/app/website_front/components/layouts/projects/News/index.tsx`
  - tabs: “Alerts” → “FOMO Updates”
  - switch-case: `<InstantAlerts />` → `<FomoUpdates sourcePath="all" />`

**Build/Deploy note (важно)**
- ✅ Next.js публичный сайт работает через `next start` (production build), поэтому:
  - выполнен `yarn build`
  - перезапущен supervisor program `fomo_website`

**Testing / Evidence**
- ✅ `testing_agent` iteration_45: вкладка “FOMO Updates” отображается и контент рендерится без ошибок.

---

### Phase 3 (P1) — Backend: Buzz stats endpoint (COMPLETED)
**User stories (≥5)**
1. ✅ Как админ, я вижу KPI по Buzz: темы/ответы/реакции/активные.
2. ✅ Как админ, я вижу модерацию: жалобы/скрытия/удаления.
3. ✅ Как админ, я вижу AI метрики: AI replies + бюджет.
4. ✅ Как админ, я вижу COGS day/month/total.
5. ✅ Как админ, я вижу 14-дневную динамику.

**Что сделано**
- ✅ `/app/fomo-backend/src/comments/comments.service.ts`
  - добавлен `getBuzzStats()` (activity/moderation/ai/cogs/series)
  - агрегации по `ai_usage_events` для операций Buzz
- ✅ `/app/fomo-backend/src/comments/comments.controller.ts`
  - `GET /comments/admin/buzz/stats` под `@Roles('admin,moderator')` + `JwtAuthGuard`

**Verification**
- ✅ Эндпоинт отвечает 403 без токена (значит маршрут зарегистрирован)
- ✅ Эндпоинт отвечает 200 с admin JWT и возвращает валидный JSON.
- ✅ NestJS пересобран (проект запускается из `dist/`).

---

### Phase 4 (P1) — CRM: Buzz hub rebuild с чистым разделением доменов (COMPLETED)
**Ключевое требование из обсуждения**
- ✅ Не смешивать: топики ≠ дайджесты ≠ календарь ≠ updates ≠ news parsing.
- ✅ Каждый раздел в CRM отвечает только за свою логику.

**User stories (≥5)**
1. ✅ Как админ, я открываю Buzz и сразу вижу дашборд с KPI и графиками.
2. ✅ Как админ, я отдельно управляю новостями и парсингом (без фида/топиков).
3. ✅ Как админ, я отдельно управляю Feed (топики/модерация/AI).
4. ✅ Как админ, я отдельно управляю календарём (без вкладки дайджестов).
5. ✅ Как админ, я отдельно управляю дайджестами (без календарных вкладок).
6. ✅ Как админ, я отдельно создаю/удаляю “FOMO Updates”.

**Что сделано**
- ✅ `/app/frontend/src/pages/Buzz/index.tsx`
  - top-level: `Дашборд | Новости | Feed | Календарь | Дайджесты | FOMO Updates`
- ✅ Новый `BuzzDashboard` (recharts, KPI + графики + бюджеты AI)
  - `/app/frontend/src/pages/Buzz/BuzzDashboard.tsx`
  - сервис `/app/frontend/src/components/services/buzz/buzzStats.ts`
- ✅ `CalendarControlCenter` разнесён по режимам:
  - `/app/frontend/src/components/layouts/calendar_layout/CalendarControlCenter.tsx`
  - `mode="calendar"` → только календарные табы
  - `mode="digests"` → только дайджесты
- ✅ `BuzzFeedSection` (Темы/Модерация/AI в обсуждениях)
  - `/app/frontend/src/pages/Buzz/BuzzFeedSection.tsx`
- ✅ `BuzzNewsSection` (Новости/Парсинг) — без updates и без feed
  - `/app/frontend/src/pages/Buzz/BuzzNewsSection.tsx`
- ✅ `BuzzUpdatesTab` (CRUD для fomo-update)
  - `/app/frontend/src/pages/Buzz/BuzzUpdatesTab.tsx`

**Testing / Evidence**
- ✅ `testing_agent` iteration_44: CRM Buzz 95% (все разделы открываются; separation Digests vs Calendar подтверждён).
- ✅ Доп. ручные скриншоты подтверждают:
  - Календарь без вкладки «Дайджесты»
  - Дайджесты без календарных вкладок

---

### Phase 5 — Testing (COMPLETED)
**User stories (≥5)**
1. ✅ Как QA, я подтверждаю, что кнопки FeedGate больше не 404.
2. ✅ Как QA, я подтверждаю, что вкладка “FOMO Updates” работает на public.
3. ✅ Как QA, я подтверждаю, что `/comments/admin/buzz/stats` отдаёт валидный JSON.
4. ✅ Как QA, я подтверждаю, что CRM Buzz отображает разделы без «каши».
5. ✅ Как QA, я подтверждаю отсутствие критических регрессий.

**Результаты**
- ✅ Public: iteration_45 — 100% pass (включая P0 FeedGate)
- ✅ Admin/CRM: iteration_44 — 95% pass

**Примечание по cookie-consent**
- Cookie modal может блокировать автотесты; в iteration_45 использован легитимный bypass через `localStorage.fomo_consent`.

## 3) Next Actions
- ✅ Все запланированные фазы завершены.

Рекомендуемые следующие шаги (не в рамках текущего плана, но логичные follow-ups):
1. (P2) Улучшить UX cookie-consent (возможность “Accept all” без дополнительных кликов / более мягкий gate).
2. (P2) Digest editor: загрузка cover image как файла (не только URL).
3. (P2) Авто-черновики еженедельных дайджестов (cron + FomoAiGateway).
4. (P2) Реальные реакции/репосты на публичных Digest страницах.

## 4) Success Criteria
- ✅ FeedGate: обе CTA ведут на существующие страницы; 404 отсутствует; экран продаёт преимущества.
- ✅ Public Buzz: “FOMO Updates” отображается и работает; “Alerts” не используется.
- ✅ Backend: `/comments/admin/buzz/stats` доступен admin/moderator и возвращает KPI + series + AI/COGS.
- ✅ CRM Buzz: чисто разделённые разделы (Dashboard/News/Feed/Calendar/Digests/Updates), без смешивания логик.
- ✅ Тесты: `testing_agent` пройден для FeedGate (iteration_45), CRM проверен (iteration_44), критических регрессий нет.
