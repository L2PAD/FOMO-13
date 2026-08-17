#!/usr/bin/env bash
set -euo pipefail

readonly SOURCE_DB="fomo_live"
readonly TARGET_DB="fomo_dev"
readonly PARSER_TARGET_DB="parser_new_dev"

readonly MONGO_CONTAINER="${MONGO_CONTAINER:-fomo-mongo}"
readonly BACKUP_ROOT="${BACKUP_ROOT:-/opt/stacks/fomo/backups}"
readonly COPY_PARSER="${COPY_PARSER:-0}"
readonly PARSER_SOURCE_DB="${PARSER_SOURCE_DB:-parser_new}"
readonly TS="$(date +%Y%m%d-%H%M%S)"
readonly CONTAINER_WORK_DIR="/tmp/fomo-live-to-dev-${TS}"

FOMO_COLLECTIONS=(
  canonical_projects
  market_assets
  market_project_read_models
  market_project_histories
  project_asset_links
  canonical_project_sources
  source_entities
  source_evidence
  source_conflicts
  review_cases
  review_batches
  backers
  backer_sources
  backer_portfolio_holdings
  funding_rounds
  funding_round_participants
  token_allocations
  token_allocation_snapshots
  vesting_schedules
  vesting_events
  unlock_events
  unresolved_backers
  import_candidates
  source_policies
  news_articles
)

PARSER_COLLECTIONS=(
  ico_projects
  dropstab_coin_catalog
  dropstab_coin_detail_data
  intel_investors
)

SENSITIVE_COLLECTIONS=(
  users
  admins
  sessions
  deposits
  withdraws
  support
  auth
  tokens
  auth_tokens
  access_tokens
  refresh_tokens
  password_resets
  password_reset_tokens
  email_resets
  email_reset_tokens
)

COUNT_LINES=()

info() {
  printf '[INFO] %s\n' "$*"
}

warn() {
  printf '[WARN] %s\n' "$*" >&2
}

die() {
  printf '[ERROR] %s\n' "$*" >&2
  exit 1
}

cleanup() {
  docker exec -e WORK_DIR="${CONTAINER_WORK_DIR}" "${MONGO_CONTAINER}" sh -lc \
    'rm -rf "$WORK_DIR"' >/dev/null 2>&1 || true
}

assert_fixed_scope() {
  [[ "${SOURCE_DB}" == "fomo_live" ]] || die "SOURCE_DB must stay fomo_live."
  [[ "${TARGET_DB}" == "fomo_dev" ]] || die "TARGET_DB must stay fomo_dev."
  [[ "${SOURCE_DB}" != "${TARGET_DB}" ]] || die "Source and target DB must differ."
  [[ "${PARSER_TARGET_DB}" == "parser_new_dev" ]] || die "Parser target DB must stay parser_new_dev."
}

assert_allowlist_is_safe() {
  local label="$1"
  shift
  local collection sensitive

  for collection in "$@"; do
    for sensitive in "${SENSITIVE_COLLECTIONS[@]}"; do
      if [[ "${collection}" == "${sensitive}" ]]; then
        die "${label} allowlist contains sensitive collection: ${collection}"
      fi
    done
  done
}

require_docker_mongo_tools() {
  command -v docker >/dev/null 2>&1 || die "docker is required on the VPS host."

  docker inspect "${MONGO_CONTAINER}" >/dev/null 2>&1 ||
    die "Mongo container ${MONGO_CONTAINER} was not found."

  [[ "$(docker inspect -f '{{.State.Running}}' "${MONGO_CONTAINER}")" == "true" ]] ||
    die "Mongo container ${MONGO_CONTAINER} is not running."

  for tool in mongosh mongodump mongorestore; do
    docker exec "${MONGO_CONTAINER}" sh -lc "command -v ${tool} >/dev/null 2>&1" ||
      die "${tool} was not found inside ${MONGO_CONTAINER}."
  done

  docker exec "${MONGO_CONTAINER}" sh -lc \
    'test -n "${MONGO_INITDB_ROOT_USERNAME:-}" && test -n "${MONGO_INITDB_ROOT_PASSWORD:-}"' ||
    die "Mongo root credentials are missing in ${MONGO_CONTAINER} environment."

  docker exec -e WORK_DIR="${CONTAINER_WORK_DIR}" "${MONGO_CONTAINER}" sh -lc \
    'rm -rf "$WORK_DIR" && mkdir -p "$WORK_DIR"'
}

docker_mongo_tool() {
  local tool="$1"
  shift

  docker exec "${MONGO_CONTAINER}" sh -lc '
    tool="$1"
    shift
    "$tool" \
      --username "$MONGO_INITDB_ROOT_USERNAME" \
      --password "$MONGO_INITDB_ROOT_PASSWORD" \
      --authenticationDatabase admin \
      "$@"
  ' sh "${tool}" "$@"
}

collection_exists() {
  local db_name="$1"
  local collection="$2"
  local output result

  if ! output="$(
    docker exec \
        -e DB_NAME="${db_name}" \
        -e COLLECTION_NAME="${collection}" \
        "${MONGO_CONTAINER}" sh -lc '
          mongosh --quiet \
            --username "$MONGO_INITDB_ROOT_USERNAME" \
            --password "$MONGO_INITDB_ROOT_PASSWORD" \
            --authenticationDatabase admin \
            "$DB_NAME" \
            --eval "db.getCollectionNames().includes(process.env.COLLECTION_NAME) ? \"yes\" : \"no\""
        '
  )"; then
    printf '%s\n' "${output}" >&2
    die "Failed to inspect ${db_name}.${collection}."
  fi

  result="$(printf '%s\n' "${output}" | tr -d '\r' | tail -n 1)"
  case "${result}" in
    yes) return 0 ;;
    no) return 1 ;;
    *) die "Unexpected collection inspection output for ${db_name}.${collection}: ${result}" ;;
  esac
}

collection_count() {
  local db_name="$1"
  local collection="$2"
  local output count

  if ! output="$(
    docker exec \
      -e DB_NAME="${db_name}" \
      -e COLLECTION_NAME="${collection}" \
      "${MONGO_CONTAINER}" sh -lc '
        mongosh --quiet \
          --username "$MONGO_INITDB_ROOT_USERNAME" \
          --password "$MONGO_INITDB_ROOT_PASSWORD" \
          --authenticationDatabase admin \
          "$DB_NAME" \
          --eval "db.getCollection(process.env.COLLECTION_NAME).countDocuments({})"
      '
  )"; then
    printf '%s\n' "${output}" >&2
    die "Failed to count ${db_name}.${collection}."
  fi

  count="$(printf '%s\n' "${output}" | tr -d '\r' | tail -n 1)"
  [[ "${count}" =~ ^[0-9]+$ ]] ||
    die "Unexpected count output for ${db_name}.${collection}: ${count}"
  printf '%s\n' "${count}"
}

backup_database() {
  local db_name="$1"
  local label="$2"
  local container_dump_dir="${CONTAINER_WORK_DIR}/backups/${label}"
  local host_backup_dir="${BACKUP_ROOT}/${label}-${TS}"

  info "Backing up ${db_name} to ${host_backup_dir}"
  docker exec -e DUMP_DIR="${container_dump_dir}" "${MONGO_CONTAINER}" sh -lc \
    'rm -rf "$DUMP_DIR" && mkdir -p "$DUMP_DIR"'

  docker_mongo_tool mongodump --db "${db_name}" --out "${container_dump_dir}"

  mkdir -p "${host_backup_dir}"
  if docker exec \
    -e DB_NAME="${db_name}" \
    -e DUMP_DIR="${container_dump_dir}" \
    "${MONGO_CONTAINER}" sh -lc 'test -d "$DUMP_DIR/$DB_NAME"'; then
    docker cp "${MONGO_CONTAINER}:${container_dump_dir}/${db_name}" "${host_backup_dir}/"
    info "Backup saved at ${host_backup_dir}/${db_name}"
  else
    warn "No dump directory was produced for ${db_name}; ${host_backup_dir} is empty."
  fi
}

copy_collection() {
  local source_db="$1"
  local target_db="$2"
  local collection="$3"
  local dump_dir="${CONTAINER_WORK_DIR}/dumps/${source_db}/${collection}"
  local source_count target_count

  if ! collection_exists "${source_db}" "${collection}"; then
    warn "Missing ${source_db}.${collection}; skipped."
    return 0
  fi

  source_count="$(collection_count "${source_db}" "${collection}")"
  info "Copying ${source_db}.${collection} -> ${target_db}.${collection} (${source_count} docs)"

  docker exec -e DUMP_DIR="${dump_dir}" "${MONGO_CONTAINER}" sh -lc \
    'rm -rf "$DUMP_DIR" && mkdir -p "$DUMP_DIR"'

  docker_mongo_tool mongodump \
    --db "${source_db}" \
    --collection "${collection}" \
    --out "${dump_dir}"

  docker_mongo_tool mongorestore \
    --drop \
    --nsInclude="${source_db}.${collection}" \
    --nsFrom="${source_db}.${collection}" \
    --nsTo="${target_db}.${collection}" \
    "${dump_dir}"

  target_count="$(collection_count "${target_db}" "${collection}")"
  COUNT_LINES+=("${target_db}.${collection}: ${target_count} docs (source ${source_count})")
}

main() {
  assert_fixed_scope
  assert_allowlist_is_safe "FOMO v2 crypto" "${FOMO_COLLECTIONS[@]}"
  assert_allowlist_is_safe "parser" "${PARSER_COLLECTIONS[@]}"
  require_docker_mongo_tools
  trap cleanup EXIT

  info "Strict source DB: ${SOURCE_DB}"
  info "Strict target DB: ${TARGET_DB}"
  info "Mongo container: ${MONGO_CONTAINER}"

  backup_database "${TARGET_DB}" "${TARGET_DB}"

  for collection in "${FOMO_COLLECTIONS[@]}"; do
    copy_collection "${SOURCE_DB}" "${TARGET_DB}" "${collection}"
  done

  if [[ "${COPY_PARSER}" == "1" ]]; then
    info "COPY_PARSER=1 enabled: ${PARSER_SOURCE_DB} -> ${PARSER_TARGET_DB}"
    backup_database "${PARSER_TARGET_DB}" "${PARSER_TARGET_DB}"

    for collection in "${PARSER_COLLECTIONS[@]}"; do
      copy_collection "${PARSER_SOURCE_DB}" "${PARSER_TARGET_DB}" "${collection}"
    done
  else
    info "Parser collections skipped. Set COPY_PARSER=1 to copy parser allowlist into ${PARSER_TARGET_DB}."
  fi

  printf '\nCopied collection counts:\n'
  if (( ${#COUNT_LINES[@]} == 0 )); then
    warn "No collections were copied."
  else
    printf '  %s\n' "${COUNT_LINES[@]}"
  fi
}

main "$@"
