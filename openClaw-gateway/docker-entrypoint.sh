#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
TOKEN_VALUE="${OPENCLAW_GATEWAY_TOKEN:-}"
PRIMARY_MODEL_VALUE="${OPENCLAW_PRIMARY_MODEL:-openai/gpt-5.2}"
ANTHROPIC_API_KEY_VALUE="${ANTHROPIC_API_KEY:-}"
OPENAI_API_KEY_VALUE="${OPENAI_API_KEY:-}"
RESET_MAIN_AGENT_VALUE="${OPENCLAW_RESET_MAIN_AGENT:-0}"

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
PRIMARY_MODEL_VALUE="$(strip_quotes "$PRIMARY_MODEL_VALUE")"
ANTHROPIC_API_KEY_VALUE="$(strip_quotes "$ANTHROPIC_API_KEY_VALUE")"
OPENAI_API_KEY_VALUE="$(strip_quotes "$OPENAI_API_KEY_VALUE")"
RESET_MAIN_AGENT_VALUE="$(strip_quotes "$RESET_MAIN_AGENT_VALUE")"

if [ -z "$TOKEN_VALUE" ]; then
  echo "OPENCLAW_GATEWAY_TOKEN is required" >&2
  exit 1
fi

if [ "$RESET_MAIN_AGENT_VALUE" = "1" ] || [ "$RESET_MAIN_AGENT_VALUE" = "true" ]; then
  rm -rf /root/.openclaw/agents/main
fi

mkdir -p /root/.openclaw
mkdir -p /root/.openclaw/agents/main/agent

sed \
  -e "s|__OPENCLAW_GATEWAY_PORT__|$PORT_VALUE|g" \
  -e "s|__OPENCLAW_GATEWAY_TOKEN__|$TOKEN_VALUE|g" \
  -e "s|__OPENCLAW_PRIMARY_MODEL__|$PRIMARY_MODEL_VALUE|g" \
  /app/openclaw.template.json > /root/.openclaw/openclaw.json

if [ -n "$OPENAI_API_KEY_VALUE" ]; then
  cat > /root/.openclaw/.env <<EOF
OPENAI_API_KEY=$OPENAI_API_KEY_VALUE
EOF

  cat > /root/.openclaw/agents/main/agent/auth-profiles.json <<'EOF'
{
  "profiles": {
    "openai:default": {
      "provider": "openai",
      "mode": "api_key"
    }
  },
  "order": {
    "openai": [
      "openai:default"
    ]
  }
}
EOF
elif [ -n "$ANTHROPIC_API_KEY_VALUE" ]; then
  cat > /root/.openclaw/.env <<EOF
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY_VALUE
EOF

  cat > /root/.openclaw/agents/main/agent/auth-profiles.json <<'EOF'
{
  "profiles": {
    "anthropic:default": {
      "provider": "anthropic",
      "mode": "api_key"
    }
  },
  "order": {
    "anthropic": [
      "anthropic:default"
    ]
  }
}
EOF
fi

exec openclaw gateway
