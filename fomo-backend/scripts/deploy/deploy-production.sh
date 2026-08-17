#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/stacks/fomo/apps/FOMO-BACK-production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.backend.production.yml}"
BACKEND_SERVICE="fomo-backend-production"
WORKER_SERVICE="fomo-v2-market-worker-production"
PORTFOLIO_WORKER_SERVICE="fomo-portfolio-worker-production"
BACKEND_HEALTH_URL="http://127.0.0.1:5001/__health"
BACKEND_HEALTH_ATTEMPTS="${BACKEND_HEALTH_ATTEMPTS:-30}"
BACKEND_HEALTH_DELAY_SECONDS="${BACKEND_HEALTH_DELAY_SECONDS:-5}"

rollback_hint() {
  echo "Production backend healthcheck failed."
  echo "Rollback commands:"
  echo "  cd ${APP_DIR}"
  if [[ -n "${PREVIOUS_SHA:-}" ]]; then
    echo "  git reset --hard ${PREVIOUS_SHA}"
  else
    echo "  git reset --hard <previous-good-sha>"
  fi
  echo "  docker compose -f ${COMPOSE_FILE} build ${BACKEND_SERVICE} ${WORKER_SERVICE} ${PORTFOLIO_WORKER_SERVICE}"
  echo "  docker compose -f ${COMPOSE_FILE} up -d --force-recreate ${BACKEND_SERVICE} ${WORKER_SERVICE} ${PORTFOLIO_WORKER_SERVICE}"
  echo "  curl -fsS ${BACKEND_HEALTH_URL}"
}

wait_for_backend_health() {
  local attempt

  for attempt in $(seq 1 "${BACKEND_HEALTH_ATTEMPTS}"); do
    if curl -fsS "${BACKEND_HEALTH_URL}" >/dev/null; then
      echo "Backend healthcheck passed on attempt ${attempt}/${BACKEND_HEALTH_ATTEMPTS}."
      return 0
    fi

    echo "Waiting for backend health ${attempt}/${BACKEND_HEALTH_ATTEMPTS}..."
    sleep "${BACKEND_HEALTH_DELAY_SECONDS}"
  done

  return 1
}

if [[ ! -e "${APP_DIR}/.git" ]]; then
  echo "Backend production worktree was not found at APP_DIR=${APP_DIR}."
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

docker compose -f "${COMPOSE_FILE}" build "${BACKEND_SERVICE}" "${WORKER_SERVICE}" "${PORTFOLIO_WORKER_SERVICE}"
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate "${BACKEND_SERVICE}" "${WORKER_SERVICE}" "${PORTFOLIO_WORKER_SERVICE}"

if ! wait_for_backend_health; then
  docker logs --tail 120 "${BACKEND_SERVICE}" || true
  rollback_hint
  exit 1
fi

docker ps --filter "name=fomo-backend-production"
docker ps --filter "name=fomo-v2-market-worker-production"
docker ps --filter "name=fomo-portfolio-worker-production"

echo "Backend production deployment completed successfully."
