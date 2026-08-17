#!/usr/bin/env bash
set -euo pipefail

readonly MONGO_CONTAINER="${MONGO_CONTAINER:-fomo-mongo}"
readonly AI_USER="${AI_USER:-fomo_ai_dev_user}"
readonly AI_DB="fomo_dev"

die() {
  printf '[ERROR] %s\n' "$*" >&2
  exit 1
}

[[ -n "${AI_ADMIN_MONGO_PASSWORD:-}" ]] ||
  die "Set AI_ADMIN_MONGO_PASSWORD before running this script."

command -v docker >/dev/null 2>&1 || die "docker is required."
docker inspect "${MONGO_CONTAINER}" >/dev/null 2>&1 ||
  die "Mongo container ${MONGO_CONTAINER} was not found."

docker exec \
  -e AI_USER="${AI_USER}" \
  -e AI_PASSWORD="${AI_ADMIN_MONGO_PASSWORD}" \
  -e AI_DB="${AI_DB}" \
  "${MONGO_CONTAINER}" sh -lc '
    set -eu
    mongosh --quiet \
      --username "$MONGO_INITDB_ROOT_USERNAME" \
      --password "$MONGO_INITDB_ROOT_PASSWORD" \
      --authenticationDatabase admin \
      "$AI_DB" <<'"'"'MONGO_JS'"'"'
const aiUser = process.env.AI_USER;
const password = process.env.AI_PASSWORD;
const aiDb = process.env.AI_DB;

if (aiDb !== "fomo_dev") {
  throw new Error("AI admin user script is hardcoded for fomo_dev only.");
}

if (db.getName() !== aiDb) {
  throw new Error(`Connected to ${db.getName()}, expected ${aiDb}.`);
}

const roles = [{ role: "readWrite", db: aiDb }];

if (db.getUser(aiUser)) {
  db.updateUser(aiUser, { pwd: password, roles });
  print(`Updated ${aiUser} in ${aiDb} with readWrite@${aiDb}; no fomo_live privileges granted.`);
} else {
  db.createUser({ user: aiUser, pwd: password, roles });
  print(`Created ${aiUser} in ${aiDb} with readWrite@${aiDb}; no fomo_live privileges granted.`);
}
MONGO_JS
  '

cat <<EOF
Created/updated ${AI_USER}.

Use this AI Admin URI:
mongodb://${AI_USER}:***@fomo-mongo:27017/fomo_dev?authSource=fomo_dev
EOF
