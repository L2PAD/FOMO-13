<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Admin AI Chat Production/Dev Deploy

VPS backend worktree:

```bash
/opt/stacks/fomo/apps/FOMO-BACK-production
```

Admin AI Chat is served by the production backend/admin UI, while its data path
uses only `AI_ADMIN_MONGO_URI` pointing at `fomo_dev`. The main backend DB can
remain `DB_NAME=fomo_live`.
`OPEN_AI_ADMIN_CHAT_MODEL` is a comma-separated allowlist for the chat model
picker; the first value is the default selected model.

Runbook:

```bash
scripts/deploy/admin-ai-chat-production-runbook.md
```

Host scripts included in the backend worktree:

```bash
scripts/create-fomo-ai-dev-user.sh
scripts/sync-fomo-live-to-dev.sh
```

## Admin Data Sync Center

Backend module:

```text
src/admin-data-sync
```

Admin endpoints are protected with existing `@Roles("admin")` and
`JwtAuthGuard`:

```text
GET  /api/admin-data-sync/config
GET  /api/admin-data-sync/jobs
GET  /api/admin-data-sync/jobs/:jobId
POST /api/admin-data-sync/prod-to-dev/preview
POST /api/admin-data-sync/prod-to-dev/run
POST /api/admin-data-sync/dev-to-prod/diff
POST /api/admin-data-sync/dev-to-prod/promotions
GET  /api/admin-data-sync/dev-to-prod/promotions/:promotionId
POST /api/admin-data-sync/dev-to-prod/promotions/:promotionId/approve
POST /api/admin-data-sync/dev-to-prod/promotions/:promotionId/apply
POST /api/admin-data-sync/dev-to-prod/promotions/:promotionId/reject
```

Required env:

```env
ADMIN_DATA_SYNC_ENABLED=true
ADMIN_DATA_SYNC_PROD_DB_NAME=fomo_live
ADMIN_DATA_SYNC_DEV_DB_NAME=fomo_dev
ADMIN_DATA_SYNC_PROD_MONGO_URI=
ADMIN_DATA_SYNC_DEV_MONGO_URI=mongodb://fomo_ai_dev_user:***@fomo-mongo:27017/fomo_dev?authSource=fomo_dev
ADMIN_DATA_SYNC_PROD_TO_DEV_ENABLED=true
ADMIN_DATA_SYNC_PROD_TO_DEV_RUN_MODE=disabled
ADMIN_DATA_SYNC_DEV_TO_PROD_DIFF_ENABLED=true
ADMIN_DATA_SYNC_DEV_TO_PROD_APPLY_ENABLED=false
ADMIN_DATA_SYNC_MONGO_CONTAINER=fomo-mongo
ADMIN_DATA_SYNC_BACKUP_DIR=/opt/stacks/fomo/backups
ADMIN_DATA_SYNC_SCRIPT_PATH=/opt/stacks/fomo/scripts/sync-fomo-live-to-dev.sh
ADMIN_DATA_SYNC_REQUIRE_APPROVAL=true
ADMIN_DATA_SYNC_REQUIRE_CONFIRMATION_PHRASE=true
ADMIN_DATA_SYNC_CONFIRMATION_PHRASE=PROMOTE FOMO V2 DEV TO PROD
ADMIN_DATA_SYNC_DISABLE_DELETE=true
ADMIN_DATA_SYNC_MAX_DIFF_DOCS=500
ADMIN_DATA_SYNC_MAX_APPLY_DOCS=200
ADMIN_DATA_SYNC_MAX_COLLECTIONS_PER_PROMOTION=5
```

`prod -> dev` previews counts, skips missing allowlisted collections with
warnings, and excludes sensitive collections. Source reads use the
`adminDataSyncProdConnection` named Mongo connection. Target reads use
`adminDataSyncDevConnection`, resolved from `ADMIN_DATA_SYNC_DEV_MONGO_URI` or,
if empty, `AI_ADMIN_MONGO_URI`; the default production connection is never used
to read `fomo_dev`. `ADMIN_DATA_SYNC_PROD_MONGO_URI` can override the source
connection, otherwise the normal backend `DB_URL`/`DB_NAME=fomo_live` route is
used. Production run mode defaults to `disabled` because the backend runs inside
Docker and must not be granted the Docker socket. If
`ADMIN_DATA_SYNC_PROD_TO_DEV_RUN_MODE=host-runner`, the backend only queues the
job; a separate host-side runner is responsible for executing
`sync-fomo-live-to-dev.sh` and updating job status.

`dev -> prod` is a promotion flow. The first release is dry-run by default and
only supports scoped selected-doc diffs. Apply is blocked unless env explicitly
enables it, the promotion is approved, the confirmation phrase matches, a backup
snapshot is created, and prod hashes still match the original diff. Delete/drop
operations are not supported.

Job, promotion, backup snapshot, and audit records intentionally stay on the
default backend Mongo connection, which in production is `fomo_live`. Only the
operational source/target collection reads and writes use the Admin Data Sync
named connections above.

For the current MVP, `scripts/create-fomo-ai-dev-user.sh` creates
`fomo_ai_dev_user` with only `readWrite` on `fomo_dev`. This lets Admin AI Chat
read sanitized FOMO v2 crypto collections and write `admin_ai_chat_folders`,
`admin_ai_chat_threads`, `admin_ai_chat_messages`, and
`admin_ai_chat_tool_runs` history, without granting any access to `fomo_live`.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
