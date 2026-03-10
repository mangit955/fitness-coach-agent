#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
TOKEN_VALUE="${OPENCLAW_GATEWAY_TOKEN:-}"

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
