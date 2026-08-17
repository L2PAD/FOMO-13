#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/stacks/fomo/apps/FOMO-ADMIN}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-fomo_v2_architecture}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.admin.dev.yml}"
SERVICE_NAME="${SERVICE_NAME:-admin-frontend}"
CONTAINER_NAME="${CONTAINER_NAME:-fomo-admin-frontend}"
LOCAL_URL="${LOCAL_URL:-http://127.0.0.1:3002}"
PUBLIC_URL="${PUBLIC_URL:-https://admin.fomo.cx}"
ENV_FILE="${ENV_FILE:-.env.development}"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "Admin repo was not found at APP_DIR=${APP_DIR}."
  echo "Confirm the server path before deploying."
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE} in ${APP_DIR}."
  echo "Create it on the server from .env.example before deploying."
  exit 1
fi

git fetch origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

chmod 644 "${ENV_FILE}" || true

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build "${SERVICE_NAME}"
docker rm -f "${CONTAINER_NAME}" || true
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d "${SERVICE_NAME}"

sleep 10

curl -fsS "${LOCAL_URL}" >/dev/null
curl -fsS "${PUBLIC_URL}" >/dev/null

docker ps --filter "name=${CONTAINER_NAME}"

echo "Admin frontend deployment completed successfully."
