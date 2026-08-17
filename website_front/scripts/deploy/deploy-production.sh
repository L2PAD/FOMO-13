#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/stacks/fomo/apps/FOMO-FRONT-production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.frontend.production.yml}"
SERVICE_NAME="fomo-frontend-production"
FRONTEND_HEALTH_URL="http://127.0.0.1:3000"

rollback_hint() {
  echo "Production frontend healthcheck failed."
  echo "Rollback commands:"
  echo "  cd ${APP_DIR}"
  if [[ -n "${PREVIOUS_SHA:-}" ]]; then
    echo "  git reset --hard ${PREVIOUS_SHA}"
  else
    echo "  git reset --hard <previous-good-sha>"
  fi
  echo "  set -a && . ./.env.production && set +a"
  echo "  docker compose -f ${COMPOSE_FILE} build ${SERVICE_NAME}"
  echo "  docker compose -f ${COMPOSE_FILE} up -d --force-recreate ${SERVICE_NAME}"
  echo "  curl -fsS ${FRONTEND_HEALTH_URL}"
}

if [[ ! -e "${APP_DIR}/.git" ]]; then
  echo "Frontend production worktree was not found at APP_DIR=${APP_DIR}."
  echo "Create it from branch main before deploying."
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f ".env.production" ]]; then
  echo "Missing .env.production in ${APP_DIR}."
  echo "Create it on the server from .env.production.example before deploying."
  exit 1
fi

chmod 640 .env.production || true

set -a
# shellcheck disable=SC1091
. ./.env.production
set +a

docker compose -f "${COMPOSE_FILE}" build "${SERVICE_NAME}"
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate "${SERVICE_NAME}"

sleep 15

if ! curl -fsS "${FRONTEND_HEALTH_URL}" >/dev/null; then
  rollback_hint
  exit 1
fi

docker ps --filter "name=fomo-frontend-production"

echo "Frontend production deployment completed successfully."
