# Fitness Coach Agent

This project includes:

- A FastAPI backend for workout planning, nutrition guidance, and progress tracking
- A Next.js web app that talks to the backend
- A Telegram bot that uses the same backend
- An OpenClaw Gateway integration through the OpenResponses-compatible `/v1/responses` API

## OpenClaw integration

The backend now supports a real OpenClaw Gateway integration through `backend/openclaw_client.py`.

It expects:

- `OPENCLAW_BASE_URL`, for example `http://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_TOKEN`
- `OPENCLAW_AGENT_ID`, for example `main`

The integration is based on OpenClaw's Gateway OpenResponses HTTP API, which exposes `POST /v1/responses`, uses bearer-token auth, and allows agent selection via `model: "openclaw:<agentId>"` or the `x-openclaw-agent-id` header.

Sources:

- https://docs.openclaw.ai/gateway/openresponses-http-api
- https://docs.openclaw.ai/gateway/authentication

If OpenClaw is not configured or unavailable, the backend falls back to the local deterministic fitness logic so the app remains usable.

## What was fixed

- Removed a hard-coded Telegram bot token from source code
- Replaced the fragile hard-coded Postgres connection with a local SQLite database that initializes itself
- Added progress tracking support instead of only a single insert path
- Removed hard-coded frontend/backend localhost assumptions by adding environment-based configuration
- Upgraded the web UI from a bare input to a usable coaching interface
- Added Dockerfiles, `docker-compose.yml`, and `render.yaml` so the stack can be deployed
- Added a validation script for backend, OpenClaw Gateway, and Telegram bot credentials

## Run the backend

From the repository root:

```bash
cd backend
python3 -m uvicorn main:app --reload
```

Optional environment variables:

- `FITNESS_DB_PATH=/absolute/path/to/fitness_coach.db`
- `CORS_ALLOW_ORIGINS=http://localhost:3000,https://your-frontend-domain`
- `OPENCLAW_BASE_URL=http://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_TOKEN=...`
- `OPENCLAW_AGENT_ID=main`

## Run the frontend

```bash
cd frontend
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/chat npm run dev
```

## Run the Telegram bot

```bash
cd telegram
TELEGRAM_BOT_TOKEN=your_bot_token FITNESS_API_URL=http://127.0.0.1:8000/chat python3 bot.py
```

## Validate the stack

```bash
python3 scripts/validate_stack.py
```

This checks:

- backend `/health`
- OpenClaw `/v1/responses` if OpenClaw env vars are present
- Telegram `getMe` if `TELEGRAM_BOT_TOKEN` is present

## Deploy

Local containerized stack:

```bash
docker compose up --build
```

Render blueprint:

- `render.yaml` defines a backend web service, frontend web service, and Telegram worker
- set `NEXT_PUBLIC_API_URL` to your public backend `/chat` URL
- set `FITNESS_API_URL` for the Telegram worker to the backend service URL

## Remaining real-world steps

These still require your credentials and network access:

1. Start and configure the OpenClaw Gateway on a reachable host, with `gateway.http.endpoints.responses.enabled=true`.
2. Set the real `OPENCLAW_*` env vars on the backend host.
3. Deploy the backend and frontend to a public host using Docker Compose, Render, or your preferred platform.
4. Set `TELEGRAM_BOT_TOKEN` and run the Telegram worker.
5. Run `python3 scripts/validate_stack.py` in a networked environment.

## Telegram token hygiene

If the previously committed Telegram token was real, revoke it immediately in BotFather and issue a new token before deploying. I removed the token from the current working tree, but I cannot revoke it or scrub it from remote Git history from this environment.
