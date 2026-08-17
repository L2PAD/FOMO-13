#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/stacks/fomo/apps/FOMO-FRONT}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-fomo_v2_architecture}"
COMPOSE_FILE="docker-compose.frontend.dev.yml"
SERVICE_NAME="frontend-development"
CONTAINER_NAME="fomo-frontend-development"
LOCAL_URL="http://127.0.0.1:3001"
PUBLIC_URL="https://development.fomo.cx"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "Frontend repo was not found at APP_DIR=${APP_DIR}."
  echo "Confirm the server path before deploying."
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f ".env.development" ]]; then
  echo "Missing .env.development in ${APP_DIR}."
  echo "Create it on the server from .env.example before deploying."
  exit 1
fi

git fetch origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

chmod 644 .env.development || true

set -a
# shellcheck disable=SC1091
. ./.env.development
set +a

docker compose -f "${COMPOSE_FILE}" build "${SERVICE_NAME}"
docker rm -f "${CONTAINER_NAME}" || true
docker compose -f "${COMPOSE_FILE}" up -d "${SERVICE_NAME}"

sleep 15

curl -fsS "${LOCAL_URL}" >/dev/null
curl -fsS "${PUBLIC_URL}" >/dev/null

echo "Frontend development deployment completed successfully."
