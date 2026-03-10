import os
import sys

import requests


def clean_env(name: str, default: str = "") -> str:
    value = os.getenv(name, default).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1].strip()
    return value


def check_backend() -> None:
    backend_url = clean_env("BACKEND_HEALTH_URL", "http://127.0.0.1:8000/health")
    response = requests.get(backend_url, timeout=10)
    response.raise_for_status()
    print(f"backend ok: {response.json()}")


def check_openclaw() -> None:
    base_url = clean_env("OPENCLAW_BASE_URL")
    token = clean_env("OPENCLAW_GATEWAY_TOKEN")
    agent_id = clean_env("OPENCLAW_AGENT_ID", "main")
    if not base_url or not token:
        print("openclaw skipped: missing OPENCLAW_BASE_URL or OPENCLAW_GATEWAY_TOKEN")
        return

    response = requests.post(
        f"{base_url.rstrip('/')}/v1/responses",
        headers={"Authorization": f"Bearer {token}"},
        json={"model": f"openclaw:{agent_id}", "input": "Reply with OK."},
        timeout=20,
    )
    response.raise_for_status()
    print("openclaw ok")


def check_telegram() -> None:
    token = clean_env("TELEGRAM_BOT_TOKEN")
    if not token:
        print("telegram skipped: missing TELEGRAM_BOT_TOKEN")
        return

    response = requests.get(f"https://api.telegram.org/bot{token}/getMe", timeout=20)
    response.raise_for_status()
    payload = response.json()
    if not payload.get("ok"):
        raise RuntimeError(f"telegram getMe failed: {payload}")
    print(f"telegram ok: {payload['result']['username']}")


def main() -> int:
    try:
        check_backend()
        check_openclaw()
        check_telegram()
        return 0
    except Exception as exc:
        print(f"validation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
