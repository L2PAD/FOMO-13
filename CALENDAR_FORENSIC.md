# EPIC CAL-1 — FOMO Unified Calendar — P0 Forensic Map

## Canonical decision
The **existing `events` module IS the canonical Calendar Event Engine.** We EXTEND it. No second engine.

## Backend map (frontend → endpoint → service → collection → source → scope → status)

### 1) Platform/Public events engine (CANONICAL) — `fomo-backend/src/events/`
- Controller `@Controller("events")` — `events.controller.ts`
  - `GET /events/private/:page` (Roles user) — user's private events
  - `GET /events/all/:page` (admin,moderator) — all events
  - `GET /events/:page` — public/global paginated
  - `POST /events/create/user` (user) — personal event
  - `POST /events/moderator` (moderator) / `POST /events/admin` (admin) — global events
  - `PUT /events/:id`, `DELETE /events/:id` (admin,moderator)
- Service: `events.service.ts` | Model: `models/event.model.ts` | Collection: `events`
- Model already has: name, date, endDate, time, endTime, status(default 'moderator'),
  stars, projectId, page, isPrivate, userId, **sourceType, sourceId**, project{Name,Slug,Logo},
  tokenSymbol, unlock{Date,Amount,ValueUsd,Percent}, **notify{Enabled,At,BeforeMinutes,SentAt,ClaimedAt,ClaimedBy,AttemptCount,LastError}**, description.
- Indexes: unique (userId, sourceType, sourceId) → user-saved dedup; due-notification index.
- => Already covers: sources, unlocks, reminders, user vs global, project events. Missing: eventType/category, visibility enum, DRAFT/SCHEDULED lifecycle, cta, sourceUrl, AI provenance, timezone, allDay, publishAt.

### 2) User calendar (Add to Calendar) — EarlyLand activities
- `fomo-backend/src/crypto-activities/activities.controller.ts`
  - `GET /crypto-activities/calendar` — user's saved activity calendar
  - `POST /crypto-activities/:id/calendar` — add activity to user calendar
  - `DELETE /crypto-activities/:id/calendar` — remove
- Model: `models/crypto-activity-calendar-item.model.ts` | Collection: `cryptoactivitycalendaritems`
  - Fields: userId, activityId, source enum(legacy|fomo_v2), (date, note...). Stores REFERENCE (userId+activityId) not a full copy → good basis for P9 reference model.

### 3) Unlocks subsystem — `fomo-backend/src/fomo-v2/domains/unlocks/`
- Controllers: `unlock-feed.controller.ts`, `unlock-actions.controller.ts`
  - `POST /:unlockId/calendar`, `DELETE /:unlockId/calendar`
- Models: `unlock-event.model.ts`, `unlock-source-ref.schema.ts`
- Services: unlocks, import runner, apply runner, **reminder service**, feed-read, actions.
- Full source with reminders + idempotent import → the TOKEN_UNLOCK source adapter target (P25).

### 4) Other event sources (chain/system, not user calendar)
- `fomo-v2/domains/launchpad/models/launchpad-chain-event.model.ts`
- `spaceport-control/model/spaceport-chain-event.model.ts`
- `spaceport-staking/model/spaceport-staking-event.model.ts`
- `advertising/models/delivery-event.model.ts`

## Frontend map
- CRM admin calendar: `frontend/src/components/layouts/calendar_layout` (now Контент → Календарь tab).
  Grid of days with "Show all (N)", Filters, date-range — reads events API.
- Public EarlyLand calendar: `website_front` (Crypto > Earlyland > Calendar) — Month/Week/Day,
  "All Types", Upcoming Deadlines, personal tasks. Currently EarlyLand-centric, not platform-wide.

## Answers to P0 questions
- User events collection: `events` (userId set, isPrivate) + `cryptoactivitycalendaritems` (activity refs).
- Global events collection: `events` (userId empty / isPrivate=false).
- Old public calendar exists = `events` module; became EarlyLand-centric on the public site.
- Activity add = reference (userId+activityId), not full copy (good).
- Date change of activity: user calendar shows live activity (reference) — needs verification in read service.
- Recurring: none. Timezone: none (dates stored as Date). Reminders: YES (notify* on Event + unlock reminder service).
- Event type/category: NOT as enum (only free `status`,`page`,`sourceType`). publish/unpublish/draft: NOT explicit.

## First vertical pass (per user): P0,P1,P3,P11,P14,P18,P19,P28,P40,P46
Extend `Event` model (non-breaking optional fields): eventType, category, visibility(PUBLIC/AUTHENTICATED/PRIVATE),
lifecycle status(DRAFT/SCHEDULED/PUBLISHED/CANCELLED/COMPLETED/ARCHIVED), ctaLabel, ctaUrl, sourceUrl, sourceName,
sourcePublishedAt, generatedBy(MANUAL/CLAUDE/OPENAI/IMPORT), reviewStatus, timezone, allDay, publishAt, publishedAt, tags[].
Add admin CRUD `/admin/calendar/events` (+ publish/unpublish/cancel/duplicate), public `/calendar/events`, EarlyLand adapter,
CRM editor+section, public unified UI, legacy adapt (no deletions).
