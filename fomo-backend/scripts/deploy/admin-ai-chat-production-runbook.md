# Admin AI Chat Production Deploy Runbook

Production backend worktree on the VPS:

```bash
/opt/stacks/fomo/apps/FOMO-BACK-production
```

Runtime env file:

```bash
/opt/stacks/fomo/apps/FOMO-BACK-production/.env.production
```

The production backend can keep its main database on `fomo_live`:

```env
DB_NAME=fomo_live
DB_URL=mongodb://.../fomo_live?authSource=admin
```

Admin AI Chat must use only the separate dev copy:

```env
AI_ADMIN_CHAT_ENABLED=true
AI_ADMIN_CHAT_OPENAI_ENABLED=true
AI_ADMIN_DB_TARGET=development
AI_ADMIN_MONGO_URI=mongodb://fomo_ai_dev_user:***@fomo-mongo:27017/fomo_dev?authSource=fomo_dev
AI_ADMIN_DB_NAME=fomo_dev
AI_ADMIN_PARSER_DB_NAME=parser_new_dev
OPEN_AI_API_BASE_URL=https://api.openai.com/v1
OPEN_AI_SECRET_KEY=***
OPEN_AI_ADMIN_CHAT_MODEL=gpt-4.1-mini,gpt-5.5,gpt-5.4-mini
```

`OPEN_AI_ADMIN_CHAT_MODEL` is a comma-separated allowlist. The first model is
selected by default in Admin AI Chat; the rest appear in the model picker.

Do not commit real secret values. `docker-compose.backend.production.yml` loads
`./.env.production` for `fomo-backend-production`,
`fomo-v2-market-worker-production`, and `fomo-portfolio-worker-production`.

## Create AI Mongo User

Run from the backend production worktree:

```bash
cd /opt/stacks/fomo/apps/FOMO-BACK-production
chmod +x scripts/create-fomo-ai-dev-user.sh
AI_ADMIN_MONGO_PASSWORD='<strong-password>' ./scripts/create-fomo-ai-dev-user.sh
```

For the MVP this script grants only `readWrite` on `fomo_dev`. That is
intentional: Admin AI Chat needs to read the sanitized FOMO v2 crypto collections
and write chat history/tool run records into `admin_ai_chat_folders`,
`admin_ai_chat_threads`, `admin_ai_chat_messages`, and
`admin_ai_chat_tool_runs`. The script does not create a custom role and grants
no privileges on `fomo_live`, `admin`, `local`, cluster resources, or other
production/live databases.

## Sync Dev Copy

```bash
cd /opt/stacks/fomo/apps/FOMO-BACK-production
chmod +x scripts/sync-fomo-live-to-dev.sh
./scripts/sync-fomo-live-to-dev.sh
```

Optional parser copy:

```bash
COPY_PARSER=1 ./scripts/sync-fomo-live-to-dev.sh
```

The sync source is hardcoded to `fomo_live`, the target is hardcoded to
`fomo_dev`, and restore uses `--drop` only for allowlisted crypto collections.
Sensitive user/auth/payment/support collections are not copied.

## Rebuild Backend

```bash
cd /opt/stacks/fomo/apps/FOMO-BACK-production
docker compose -f docker-compose.backend.production.yml up -d --build --force-recreate fomo-backend-production
```

If workers are being deployed at the same time:

```bash
docker compose -f docker-compose.backend.production.yml up -d --build --force-recreate \
  fomo-backend-production \
  fomo-v2-market-worker-production \
  fomo-portfolio-worker-production
```

## Verify Env In Container

This prints only presence/safe values, not secrets:

```bash
docker exec fomo-backend-production sh -lc '
  env | grep -E "^(AI_ADMIN_CHAT_ENABLED|AI_ADMIN_CHAT_OPENAI_ENABLED|AI_ADMIN_DB_TARGET|AI_ADMIN_DB_NAME|AI_ADMIN_PARSER_DB_NAME|OPEN_AI_API_BASE_URL|OPEN_AI_ADMIN_CHAT_MODEL)="
  test -n "${AI_ADMIN_MONGO_URI:-}" && echo "AI_ADMIN_MONGO_URI=set"
  test -n "${OPEN_AI_SECRET_KEY:-}" && echo "OPEN_AI_SECRET_KEY=set"
'
```

## Verify Dev DB Reads

Open `admin.fomo.cx/admin-ai-chat` and run:

```text
Show FOMO v2 collection stats
Find project by name Sonic
Show full FOMO v2 context for Monad
```

Confirm backend logs show tool calls with `dbTarget=fomo_dev`:

```bash
docker logs --tail=200 fomo-backend-production | grep 'Admin AI tool call'
```

There should be no Admin AI tool log with `dbTarget=fomo_live`. If
`AI_ADMIN_MONGO_URI`, `AI_ADMIN_DB_NAME`, or `AI_ADMIN_DB_TARGET` points to
production/live, the Admin AI Chat guard must block the request.
