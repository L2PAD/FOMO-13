#!/usr/bin/env bash
set -euo pipefail

cd /opt/stacks/fomo/apps/FOMO-BACK

git fetch origin fomo_v2_architecture
git reset --hard origin/fomo_v2_architecture

chmod 644 .env.production

docker compose -f docker-compose.backend.prod.yml build backend
docker rm -f fomo-backend || true
docker compose -f docker-compose.backend.prod.yml up -d backend

sleep 15

curl -fsS http://127.0.0.1:5000/__health
curl -fsS https://devapi.fomo.cx/__health

docker ps --filter "name=fomo-backend"
