#!/usr/bin/env bash
# Restore the FOMO NestJS backend on port 8001 after a pod/supervisor reset.
# The platform's read-only supervisor runs a placeholder Python backend on 8001;
# we replace it with the NestJS app (fomo_nest) for the live preview.
set -e

echo "[1/5] Ensuring Redis is running..."
redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes --port 6379

echo "[2/5] Installing supervisor program (if missing)..."
cat > /etc/supervisor/conf.d/fomo_nest.conf <<'CONF'
[program:fomo_nest]
command=node dist/main.js
directory=/app/fomo-backend
autostart=true
autorestart=true
startsecs=10
stderr_logfile=/var/log/supervisor/fomo_nest.err.log
stdout_logfile=/var/log/supervisor/fomo_nest.out.log
stopsignal=TERM
stopwaitsecs=15
stopasgroup=true
killasgroup=true
CONF

echo "[3/5] Freeing port 8001 (stop placeholder python backend)..."
supervisorctl stop backend || true

echo "[4/5] Reloading supervisor + starting fomo_nest..."
supervisorctl reread || true
supervisorctl update || true
supervisorctl restart fomo_nest || supervisorctl start fomo_nest || true

echo "[5/5] Waiting for health..."
sleep 12
curl -s -m 5 http://localhost:8001/__health && echo " OK" || echo " NOT healthy yet"
