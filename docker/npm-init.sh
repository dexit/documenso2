#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# NPM Init — seeds Nginx Proxy Manager with proxy hosts for all services.
#
# Runs once as a one-shot container after NPM is healthy. Safe to re-run:
# it checks for existing hosts before creating them.
#
# Env vars (all optional — sensible defaults shown):
#   NPM_ADMIN_EMAIL       admin email (default: admin@example.com)
#   NPM_ADMIN_PASSWORD    admin password (default: changeme)
#   DOCUMENSO_DOMAIN      main app domain   (e.g. docs.example.com)
#   MINIO_DOMAIN          Minio console domain (e.g. minio.example.com)
#   STATUS_DOMAIN         Uptime Kuma domain   (e.g. status.example.com)
#   NPM_DOMAIN            NPM admin domain     (e.g. npm.example.com)
# ─────────────────────────────────────────────────────────────────────────────
set -e

NPM_URL="http://nginx-proxy-manager:81"
ADMIN_EMAIL="${NPM_ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${NPM_ADMIN_PASSWORD:-changeme}"

DOCUMENSO_DOMAIN="${DOCUMENSO_DOMAIN:-}"
MINIO_DOMAIN="${MINIO_DOMAIN:-}"
STATUS_DOMAIN="${STATUS_DOMAIN:-}"
NPM_DOMAIN="${NPM_DOMAIN:-}"

# ── helpers ──────────────────────────────────────────────────────────────────

wait_for_npm() {
  echo "[npm-init] Waiting for Nginx Proxy Manager to be ready..."
  i=0
  until curl -sf "${NPM_URL}/api/" > /dev/null 2>&1; do
    i=$((i + 1))
    if [ $i -ge 60 ]; then
      echo "[npm-init] ERROR: NPM did not become ready in time." >&2
      exit 1
    fi
    sleep 3
  done
  echo "[npm-init] NPM is ready."
}

login() {
  local resp
  resp=$(curl -sf -X POST "${NPM_URL}/api/tokens" \
    -H "Content-Type: application/json" \
    -d "{\"identity\":\"${ADMIN_EMAIL}\",\"secret\":\"${ADMIN_PASSWORD}\"}" 2>&1) || true

  # On first boot NPM uses default creds even if we passed custom ones; retry.
  if echo "$resp" | grep -q '"token"'; then
    TOKEN=$(echo "$resp" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    return 0
  fi

  # Try default creds as fallback
  resp=$(curl -sf -X POST "${NPM_URL}/api/tokens" \
    -H "Content-Type: application/json" \
    -d '{"identity":"admin@example.com","secret":"changeme"}' 2>&1) || true

  if echo "$resp" | grep -q '"token"'; then
    TOKEN=$(echo "$resp" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

    # Update admin credentials if they differ from defaults
    if [ "$ADMIN_EMAIL" != "admin@example.com" ] || [ "$ADMIN_PASSWORD" != "changeme" ]; then
      echo "[npm-init] Updating admin credentials..."
      USER_ID=$(curl -sf "${NPM_URL}/api/users" \
        -H "Authorization: Bearer ${TOKEN}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

      curl -sf -X PUT "${NPM_URL}/api/users/${USER_ID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${ADMIN_EMAIL}\",\"nickname\":\"Admin\",\"roles\":[\"admin\"]}" > /dev/null

      curl -sf -X PUT "${NPM_URL}/api/users/${USER_ID}/auth" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"password\",\"current\":\"changeme\",\"secret\":\"${ADMIN_PASSWORD}\"}" > /dev/null

      echo "[npm-init] Admin credentials updated."
    fi
    return 0
  fi

  echo "[npm-init] ERROR: Could not authenticate with NPM." >&2
  exit 1
}

# Check if a proxy host already exists for a domain.
host_exists() {
  local domain="$1"
  curl -sf "${NPM_URL}/api/nginx/proxy-hosts" \
    -H "Authorization: Bearer ${TOKEN}" | grep -q "\"${domain}\""
}

create_proxy_host() {
  local domain="$1"
  local forward_host="$2"
  local forward_port="$3"
  local websocket="${4:-false}"
  local label="$5"

  if [ -z "$domain" ]; then
    echo "[npm-init] Skipping ${label}: no domain configured."
    return 0
  fi

  if host_exists "$domain"; then
    echo "[npm-init] Proxy host '${domain}' already exists — skipping."
    return 0
  fi

  curl -sf -X POST "${NPM_URL}/api/nginx/proxy-hosts" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"domain_names\": [\"${domain}\"],
      \"forward_scheme\": \"http\",
      \"forward_host\": \"${forward_host}\",
      \"forward_port\": ${forward_port},
      \"block_exploits\": true,
      \"allow_websocket_upgrade\": ${websocket},
      \"access_list_id\": 0,
      \"certificate_id\": 0,
      \"ssl_forced\": false,
      \"http2_support\": false,
      \"hsts_enabled\": false,
      \"hsts_subdomains\": false,
      \"caching_enabled\": false,
      \"advanced_config\": \"\"
    }" > /dev/null

  echo "[npm-init] Created proxy host: ${domain} → ${forward_host}:${forward_port}"
}

# ── main ─────────────────────────────────────────────────────────────────────

wait_for_npm
login

echo "[npm-init] Configuring proxy hosts..."

# Documenso app (WebSocket needed for HMR/dev; safe to enable in prod too)
create_proxy_host \
  "${DOCUMENSO_DOMAIN}" \
  "documenso" \
  "${PORT:-3000}" \
  "true" \
  "Documenso"

# Minio console
create_proxy_host \
  "${MINIO_DOMAIN}" \
  "minio" \
  "9001" \
  "true" \
  "Minio Console"

# Uptime Kuma (status page)
create_proxy_host \
  "${STATUS_DOMAIN}" \
  "uptime-kuma" \
  "3001" \
  "true" \
  "Uptime Kuma"

# NPM admin UI (proxy to itself — useful if you want it on a clean domain)
create_proxy_host \
  "${NPM_DOMAIN}" \
  "nginx-proxy-manager" \
  "81" \
  "false" \
  "NPM Admin"

echo "[npm-init] Done. Configure SSL via the NPM admin UI at port 81."
echo "[npm-init]   Default login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
