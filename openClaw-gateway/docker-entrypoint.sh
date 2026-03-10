#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
TOKEN_VALUE="${OPENCLAW_GATEWAY_TOKEN:-}"

strip_quotes() {
  value="$1"
  case "$value" in
    \"*\") value="${value#\"}"; value="${value%\"}" ;;
    \'*\') value="${value#\'}"; value="${value%\'}" ;;
  esac
  printf '%s' "$value"
}

PORT_VALUE="$(strip_quotes "$PORT_VALUE")"
TOKEN_VALUE="$(strip_quotes "$TOKEN_VALUE")"

if [ -z "$TOKEN_VALUE" ]; then
  echo "OPENCLAW_GATEWAY_TOKEN is required" >&2
  exit 1
fi

mkdir -p /root/.openclaw

sed \
  -e "s|__OPENCLAW_GATEWAY_PORT__|$PORT_VALUE|g" \
  -e "s|__OPENCLAW_GATEWAY_TOKEN__|$TOKEN_VALUE|g" \
  /app/openclaw.template.json > /root/.openclaw/openclaw.json

exec openclaw gateway
