# Production Mongo DB Clone

This is a one-time step before the first production deploy.

Current audit on VPS:

- Development backend container: `fomo-backend`
- Development env file: `/opt/stacks/fomo/apps/FOMO-BACK/.env.production`
- Development DB resolved from `DB_URL`: `fomo_prod`
- Production app DB name for `fomo.cx` / `api.fomo.cx`: `fomo_live`
- Parser DB name remains: `parser_prod`
- Existing non-system DB names seen during audit: `fomo_dev`, `fomo_prod`, `parser_prod`

Despite its name, `fomo_prod` is currently used by the development backend behind
`devapi.fomo.cx`. Treat it as the source DB for the initial production clone, not
as the new production DB. Do not edit the development env file. Do not drop any
database during this step.

## Preflight

Run this from the VPS host:

```bash
docker exec fomo-mongo sh -lc 'command -v mongodump && command -v mongorestore'
```

Check whether the production DB already exists:

```bash
DEV_DB="fomo_prod"
PROD_DB="fomo_live"

docker exec -e PROD_DB="${PROD_DB}" fomo-mongo sh -lc '
  mongosh --quiet \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --eval "db.adminCommand({listDatabases:1,nameOnly:true}).databases.some(d => d.name === process.env.PROD_DB) ? \"exists\" : \"missing\""
'
```

If the result is `exists`, stop and create a backup of that production DB before doing anything else. Do not overwrite it without explicit confirmation.

Optional backup command for an already existing production DB:

```bash
PROD_DB="fomo_live"
TS="$(date +%Y%m%d-%H%M%S)"
CONTAINER_DUMP_DIR="/tmp/fomo-prod-db-backup-${TS}"
HOST_BACKUP_DIR="/opt/stacks/fomo/backups/mongo-${PROD_DB}-${TS}"

docker exec -e PROD_DB="${PROD_DB}" -e CONTAINER_DUMP_DIR="${CONTAINER_DUMP_DIR}" fomo-mongo sh -lc '
  set -eu
  mongodump \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --db "$PROD_DB" \
    --out "$CONTAINER_DUMP_DIR"
'

sudo mkdir -p "${HOST_BACKUP_DIR}"
docker cp "fomo-mongo:${CONTAINER_DUMP_DIR}/${PROD_DB}" "${HOST_BACKUP_DIR}/"
docker exec -e CONTAINER_DUMP_DIR="${CONTAINER_DUMP_DIR}" fomo-mongo sh -lc 'rm -rf "$CONTAINER_DUMP_DIR"'
```

## One-Time Clone

This command dumps the current development DB and restores it into the production DB. It does not delete or modify the development DB.

```bash
DEV_DB="fomo_prod"
PROD_DB="fomo_live"
TS="$(date +%Y%m%d-%H%M%S)"
DUMP_DIR="/tmp/fomo-db-clone-${TS}"

docker exec -e DEV_DB="${DEV_DB}" -e DUMP_DIR="${DUMP_DIR}" fomo-mongo sh -lc '
  set -eu
  mongodump \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --db "$DEV_DB" \
    --out "$DUMP_DIR"
'

docker exec -e PROD_DB="${PROD_DB}" fomo-mongo sh -lc '
  set -eu
  STATUS="$(mongosh --quiet \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --eval "db.adminCommand({listDatabases:1,nameOnly:true}).databases.some(d => d.name === process.env.PROD_DB) ? \"exists\" : \"missing\"")"
  test "$STATUS" = "missing"
'

docker exec -e DEV_DB="${DEV_DB}" -e PROD_DB="${PROD_DB}" -e DUMP_DIR="${DUMP_DIR}" fomo-mongo sh -lc '
  set -eu
  mongorestore \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --nsFrom="${DEV_DB}.*" \
    --nsTo="${PROD_DB}.*" \
    "$DUMP_DIR/$DEV_DB"
'

docker exec -e DUMP_DIR="${DUMP_DIR}" fomo-mongo sh -lc 'rm -rf "$DUMP_DIR"'
```

## Production Env

Production backend and worker must point only to the production DB:

```dotenv
DB_URL=mongodb://<user>:<password>@fomo-mongo:27017/fomo_live?authSource=admin
MONGO_URL=mongodb://<user>:<password>@fomo-mongo:27017/fomo_live?authSource=admin
MONGODB_URI=mongodb://<user>:<password>@fomo-mongo:27017/fomo_live?authSource=admin
DB_NAME=fomo_live
DB_PARSER_NAME=parser_prod
```

After the production cutover, plan a separate DB naming cleanup: development
should move to `fomo_dev`, while production should stay on `fomo_live`.

## Rollback

Rollback application containers only:

```bash
cd /opt/stacks/fomo/apps/FOMO-BACK-production
docker compose -f docker-compose.backend.production.yml stop fomo-backend-production fomo-v2-market-worker-production
```

Do not delete `fomo_live` without separate confirmation. Never delete or restore over `fomo_prod` as part of production rollback.
