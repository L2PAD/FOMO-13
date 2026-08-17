#!/usr/bin/env bash
#
# FOMO monorepo bootstrap
# =======================
# Brings up the WHOLE project from a fresh checkout, in ONE place:
#   1. Backend   -> /app/fomo-backend   (NestJS, supervisor: fomo_nest, port 5000)
#   2. Admin     -> /app/frontend       (CRA,    supervisor: frontend,  port 3000)
#   3. Website   -> /app/website_front  (Next.js, supervisor: fomo_website, port 3001)
#      (public FOMO site, branch fomo_v2_architecture, cloned automatically if missing)
#   + MongoDB (supervisor: mongodb)
#
# The website is wired to the SAME backend the admin uses so that changes made
# in the admin panel (e.g. flag moderation) are reflected on the public site.
#
# Usage:
#   bash /app/bootstrap.sh            # idempotent: installs only what's missing
#   FORCE_INSTALL=1 bash /app/bootstrap.sh   # force re-install of node_modules
#
set -euo pipefail

APP_DIR="/app"
BACKEND_DIR="$APP_DIR/fomo-backend"
ADMIN_DIR="$APP_DIR/frontend"
WEBSITE_DIR="$APP_DIR/website_front"
DEPLOY_DIR="$APP_DIR/deploy"
SUPERVISOR_CONF_DIR="/etc/supervisor/conf.d"

WEBSITE_REPO="https://github.com/FOMOwiki/FOMO-FRONT"
WEBSITE_BRANCH="fomo_v2_architecture"

log() { echo -e "\n\033[1;36m[bootstrap]\033[0m $*"; }

# ---------------------------------------------------------------------------
# 0. Derive the backend URL the admin uses (portable across deploys).
# ---------------------------------------------------------------------------
BACKEND_URL="https://monetization-core-1.preview.emergentagent.com"
if [ -f "$ADMIN_DIR/.env" ]; then
  FROM_ENV="$(grep -E '^REACT_APP_BACKEND_URL=' "$ADMIN_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
  if [ -n "${FROM_ENV:-}" ]; then BACKEND_URL="$FROM_ENV"; fi
fi
BACKEND_URL="${BACKEND_URL%/}"
log "Backend URL (shared by admin + website): $BACKEND_URL"

# ---------------------------------------------------------------------------
# 0b. Ensure env files exist (they are git-ignored, so regenerate on fresh pod
#     to keep the monorepo self-contained). Existing files are NOT overwritten.
# ---------------------------------------------------------------------------
if [ ! -f "$BACKEND_DIR/.env" ]; then
  log "Generating $BACKEND_DIR/.env (preview defaults)"
  cat > "$BACKEND_DIR/.env" <<EOF
NODE_ENV=development
PORT=5000
MONGO_URL=mongodb://localhost:27017
DB_URL=mongodb://localhost:27017
DB_NAME=fomo_dev
SESSION_SECRET=fomo-preview-session-secret-7f3a9c2e-change-me
SESSION_COOKIE_NAME=fomo.sid
SESSION_COOKIE_SAMESITE=lax
SESSION_COOKIE_SECURE=false
JWT_SECRET_ACCESS=fomo-preview-jwt-access-secret-4b8e1d6a
JWT_SECRET_REFRESH=fomo-preview-jwt-refresh-secret-9c2f7e3b
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=30d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_URL=redis://127.0.0.1:6379
CORS_ORIGINS=$BACKEND_URL,http://localhost:3000,http://localhost:3001
SEED_ADMIN_EMAIL=admin@fomo.local
SEED_ADMIN_PASSWORD=Admin@12345
RATING_INGEST_TOKEN=fomo-rating-ingest-preview-7f3a9c2e
EMAIL_DEV_BYPASS=true
TWITTER_CONSUMER_KEY=dummy-twitter-consumer-key
TWITTER_CONSUMER_SECRET=dummy-twitter-consumer-secret
TWITTER_CALLBACK=$BACKEND_URL/api/twitter/callback
IS_LOCAL_RUN=true
CRON_ENABLED=false
FOMO_V2_LAUNCHPAD_INDEXER_ENABLED=false
FOMO_V2_MARKET_DATA_ENABLED=false
FOMO_V2_MARKET_QUEUE_ENABLED=false
FOMO_V2_MARKET_SYNC_LATEST_ENABLED=false
FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_ENABLED=false
FOMO_V2_MARKET_HISTORY_IMPORT_WORKER_ENABLED=false
FOMO_V2_PARSER_CONTROL_WORKER_ENABLED=false
FOMO_V2_UNLOCK_REMINDER_WORKER_ENABLED=false
FOMO_V2_BACKERS_ANALYTICS_SNAPSHOT_ENABLED=false
NEWS_ARTICLES_IMPORT_ENABLED=false
LEGACY_CRYPTO_ACTIVITIES_SYNC_ENABLED=false
PORTFOLIO_AUTO_RECALC_ENABLED=false
AI_ADMIN_CHAT_ENABLED=true
AI_PROVIDER=emergent
EMERGENT_LLM_KEY=sk-emergent-0A7677e1b09Ea2bCe9
EMERGENT_LLM_BASE_URL=https://integrations.emergentagent.com/llm
AI_ADMIN_DB_TARGET=development
AI_ADMIN_DB_NAME=fomo_dev
AI_ADMIN_PARSER_DB_NAME=parser_new_dev
AI_ADMIN_MONGO_URI=mongodb://localhost:27017
# --- Money / zkSync acquiring (H3) ---
# RPC must be http(s) for ethers JsonRpcProvider (NOT ws://). Public default
# works out of the box; operator can override in CRM -> Acquiring -> Networks.
MONEY_ACTIVE_NETWORK=ZKSYNC_USDC
MONEY_ZKSYNC_CHAIN_ID=324
MONEY_ZKSYNC_RPC_URL=https://zksync.drpc.org
MONEY_ZKSYNC_USDC_ADDRESS=0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4
MONEY_TREASURY_ADDRESS=0xc6b848CA645603521C81D439aC0C856dbDAaeD2F
EOF
else
  log "Backend .env already present (skip)"
fi

# Admin CRA needs REACT_APP_API_BASE_URL + non-blocking lint/ts for a clean dev boot.
if [ -f "$ADMIN_DIR/.env" ]; then
  # Ensure the file ends with a newline so appended vars don't get concatenated
  # onto the last existing line (which would silently break CRA env parsing).
  [ -n "$(tail -c1 "$ADMIN_DIR/.env")" ] && echo "" >> "$ADMIN_DIR/.env"
  grep -q '^REACT_APP_API_BASE_URL=' "$ADMIN_DIR/.env" || echo "REACT_APP_API_BASE_URL=$BACKEND_URL/api" >> "$ADMIN_DIR/.env"
  grep -q '^ESLINT_NO_DEV_ERRORS=' "$ADMIN_DIR/.env" || echo "ESLINT_NO_DEV_ERRORS=true" >> "$ADMIN_DIR/.env"
  grep -q '^TSC_COMPILE_ON_ERROR=' "$ADMIN_DIR/.env" || echo "TSC_COMPILE_ON_ERROR=true" >> "$ADMIN_DIR/.env"
  grep -q '^DISABLE_ESLINT_PLUGIN=' "$ADMIN_DIR/.env" || echo "DISABLE_ESLINT_PLUGIN=true" >> "$ADMIN_DIR/.env"
fi


install_deps() {
  local dir="$1" name="$2" extra="${3:-}"
  if [ ! -d "$dir/node_modules" ] || [ "${FORCE_INSTALL:-0}" = "1" ]; then
    log "Installing dependencies: $name ($dir) ${extra:+[$extra]}"
    (cd "$dir" && yarn install --network-timeout 600000 $extra)
  else
    log "Dependencies already present: $name (skip; FORCE_INSTALL=1 to reinstall)"
  fi
}

# ---------------------------------------------------------------------------
# 1. Backend (NestJS)
# ---------------------------------------------------------------------------
if [ -d "$BACKEND_DIR" ]; then
  install_deps "$BACKEND_DIR" "backend"
  # @types/cron is a deprecated stub package (no index.d.ts) that breaks
  # `nest build` with TS2688. cron ships its own types, so drop the stub.
  rm -rf "$BACKEND_DIR/node_modules/@types/cron"
  if [ ! -f "$BACKEND_DIR/dist/main.js" ]; then
    log "Building backend (nest build)"
    (cd "$BACKEND_DIR" && yarn build)
  else
    log "Backend already built (dist/main.js present)"
  fi
else
  log "WARNING: backend dir $BACKEND_DIR not found — skipping"
fi

# ---------------------------------------------------------------------------
# 2. Admin frontend (CRA)
# ---------------------------------------------------------------------------
if [ -d "$ADMIN_DIR" ]; then
  install_deps "$ADMIN_DIR" "admin"
else
  log "WARNING: admin dir $ADMIN_DIR not found — skipping"
fi

# ---------------------------------------------------------------------------
# 3. Public website (Next.js) — clone if missing, wire to shared backend
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# 3. Public website (Next.js) — VENDORED into the monorepo.
#    The source now lives in-repo at $WEBSITE_DIR (no external clone needed).
#    We only fall back to cloning if the source is somehow missing.
# ---------------------------------------------------------------------------
if [ ! -f "$WEBSITE_DIR/package.json" ]; then
  log "Website source missing at $WEBSITE_DIR — cloning $WEBSITE_REPO ($WEBSITE_BRANCH) as fallback"
  rm -rf "$WEBSITE_DIR"
  git clone --depth 1 --branch "$WEBSITE_BRANCH" "$WEBSITE_REPO" "$WEBSITE_DIR"
  rm -rf "$WEBSITE_DIR/.git"
else
  log "Website already vendored in monorepo at $WEBSITE_DIR (no clone needed)"
fi

log "Writing website env (.env.local) -> shared backend"
cat > "$WEBSITE_DIR/.env.local" <<EOF
# AUTO-GENERATED by /app/bootstrap.sh — points the website at the same backend
# the admin panel uses. Do not edit by hand; edit bootstrap.sh instead.
NEXT_PUBLIC_API_URL=$BACKEND_URL/api
NEXT_PUBLIC_LOADER_API=$BACKEND_URL
API_BASE_URL=$BACKEND_URL
NEXT_PUBLIC_REF_LINK=$BACKEND_URL/ref/
EOF

# Patch package.json: pin @wagmi/connectors to avoid the '@wagmi/core/tempo'
# resolution conflict. Upstream branch ships NO lockfile, so a fresh install
# otherwise resolves @reown/appkit-adapter-wagmi's nested @wagmi/connectors@8.x
# (which needs @wagmi/core@3) against the app's @wagmi/core@2 -> build error.
log "Patching website package.json (wagmi resolution + missing emoji-mart dep)"
node -e '
const fs = require("fs");
const f = process.argv[1];
const p = JSON.parse(fs.readFileSync(f, "utf8"));
let changed = false;
p.resolutions = p.resolutions || {};
if (p.resolutions["@wagmi/connectors"] !== "6.2.0") {
  p.resolutions["@wagmi/connectors"] = "6.2.0"; changed = true;
}
// Upstream lists @emoji-mart/react but not its peer "emoji-mart" -> Fomies page 500s.
p.dependencies = p.dependencies || {};
if (!p.dependencies["emoji-mart"]) {
  p.dependencies["emoji-mart"] = "^5"; changed = true;
}
if (changed) {
  fs.writeFileSync(f, JSON.stringify(p, null, 2) + "\n");
  console.log("  -> package.json patched");
} else {
  console.log("  -> package.json already patched");
}
' "$WEBSITE_DIR/package.json"

install_deps "$WEBSITE_DIR" "website" "--ignore-engines"
# ---------------------------------------------------------------------------
# 4. Supervisor: install program confs (redis, fomo_nest, fomo_website).
#    (backend[FastAPI proxy], admin[frontend], mongodb are managed by the
#     platform's read-only supervisord.conf.)
# ---------------------------------------------------------------------------
# Ensure Redis is installed (session store + Bull queues). Idempotent + verified.
# System packages are ephemeral on pod recreation, so (re)install only if the
# binary is missing; never reinstall over an existing/working version.
if command -v redis-server >/dev/null 2>&1; then
  log "redis-server present ($(redis-server --version 2>/dev/null | awk '{print $3}'))"
else
  log "Installing redis-server (system dependency, missing)"
  (apt-get update && apt-get install -y redis-server) || log "  -> redis install failed (non-fatal)"
fi

for conf in redis fomo_nest fomo_website; do
  if [ -f "$DEPLOY_DIR/$conf.conf" ]; then
    log "Installing supervisor program: $conf"
    cp "$DEPLOY_DIR/$conf.conf" "$SUPERVISOR_CONF_DIR/$conf.conf"
  fi
done

log "Reloading supervisor"
supervisorctl reread || true
supervisorctl update || true
supervisorctl start redis || supervisorctl restart redis || true
# Verify Redis actually answers before starting dependents.
for i in 1 2 3 4 5; do
  if redis-cli -h 127.0.0.1 -p 6379 ping 2>/dev/null | grep -q PONG; then
    log "redis PING ok"
    break
  fi
  sleep 1
done
# fomo_nest serves /api on 5000; the FastAPI proxy (program:backend) forwards to it.
supervisorctl restart fomo_nest || supervisorctl start fomo_nest || true
supervisorctl restart fomo_website || supervisorctl start fomo_website || true

# ---------------------------------------------------------------------------
# 4b. Seed demo data (idempotent). Admin user + Fomies (platform users) so the
#     admin login works and the public Crypto -> Fomies tab renders content.
# ---------------------------------------------------------------------------
if [ -f "$BACKEND_DIR/scripts/seed-admin.js" ]; then
  log "Seeding admin user (idempotent)"
  (cd "$BACKEND_DIR" && set -a && . ./.env 2>/dev/null && set +a && node scripts/seed-admin.js) \
    || log "  -> admin seed skipped/failed (non-fatal)"
fi
if [ -f "$BACKEND_DIR/scripts/seed-fomies.js" ]; then
  log "Seeding demo Fomies (idempotent)"
  (cd "$BACKEND_DIR" && set -a && . ./.env 2>/dev/null && set +a && node scripts/seed-fomies.js) \
    || log "  -> seed skipped/failed (non-fatal)"
fi
if [ -f "$BACKEND_DIR/scripts/seed-c360-demo.js" ]; then
  log "Seeding Customer 360 demo data (deals/deposits/withdraws/portfolio/comments/support/appeals, idempotent)"
  (cd "$BACKEND_DIR" && set -a && . ./.env 2>/dev/null && set +a && node scripts/seed-c360-demo.js) \
    || log "  -> c360 demo seed skipped/failed (non-fatal)"
fi
if [ -f "$BACKEND_DIR/scripts/seed-nft-demo.js" ]; then
  log "Seeding NFT marketplace demo data (collections/listings/sales, idempotent)"
  (cd "$BACKEND_DIR" && set -a && . ./.env 2>/dev/null && set +a && node scripts/seed-nft-demo.js) \
    || log "  -> nft demo seed skipped/failed (non-fatal)"
fi
if [ -f "$BACKEND_DIR/scripts/seed-earlyland-prime.js" ]; then
  log "Seeding EarlyLand Prime test cards (Monad/Berachain/MegaETH, idempotent)"
  (cd "$BACKEND_DIR" && set -a && . ./.env 2>/dev/null && set +a && node scripts/seed-earlyland-prime.js) \
    || log "  -> prime seed skipped/failed (non-fatal)"
fi
if [ -f "$BACKEND_DIR/scripts/seed-money-network.js" ]; then
  log "Seeding zkSync/USDC acquiring network config (idempotent; repairs unusable RPC)"
  (cd "$BACKEND_DIR" && set -a && . ./.env 2>/dev/null && set +a && node scripts/seed-money-network.js) \
    || log "  -> money network seed skipped/failed (non-fatal)"
fi
if [ -f "$BACKEND_DIR/scripts/seed-local-ads.js" ]; then
  log "Seeding DEMO local ad banners (one editable campaign per section; idempotent, flagged demo, deletable in CRM)"
  (cd "$BACKEND_DIR" && set -a && . ./.env 2>/dev/null && set +a && node scripts/seed-local-ads.js) \
    || log "  -> local ads demo seed skipped/failed (non-fatal)"
fi

# ---------------------------------------------------------------------------
# 4b. FOMO AI knowledge seed (grounding data for the AI chat)
#     Small pre-exported collections restored idempotently (only if empty),
#     so deploys never re-download the multi-GB source dump.
# ---------------------------------------------------------------------------
SEED_DIR="/app/db_seed"
if [ -d "$SEED_DIR" ]; then
  restore_seed() {
    local coll="$1"; local archive="$SEED_DIR/$coll.archive.gz"
    [ -f "$archive" ] || return 0
    local count
    count=$(mongosh "$MONGO_URL/$DB_NAME" --quiet --eval "db.getCollection('$coll').countDocuments()" 2>/dev/null || echo 0)
    if [ "${count:-0}" -gt 0 ]; then
      log "  -> AI seed '$coll' already present ($count docs), skipping"
    else
      log "  -> Restoring AI knowledge seed: $coll"
      mongorestore --uri="$MONGO_URL" --gzip --archive="$archive" \
        --nsFrom "fomo_dev.$coll" --nsTo "$DB_NAME.$coll" --drop \
        >/dev/null 2>&1 || log "     (restore of $coll failed, non-fatal)"
    fi
  }
  log "Seeding FOMO AI knowledge collections (idempotent)"
  restore_seed "ico_project_read_models"
  restore_seed "market_project_roi_metrics"
fi

# ---------------------------------------------------------------------------
# 5. Status
# ---------------------------------------------------------------------------
log "Current service status:"
supervisorctl status || true

cat <<EOF

\033[1;32m[bootstrap] Done.\033[0m
  Backend  : $BACKEND_URL/api        (supervisor: fomo_nest, port 5000)
  Admin    : port 3000               (supervisor: frontend)  [exposed via preview URL]
  Website  : http://localhost:3001   (supervisor: fomo_website)
Note: the preview URL only routes to ONE frontend (port 3000 = admin).
The website (3001) is reachable inside the pod / via screenshots / port-forward.
EOF
