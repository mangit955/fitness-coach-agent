import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.agent.agent import run_agent
except ImportError:
    from agent.agent import run_agent
try:
    from backend.openclaw_client import openclaw_client
except ImportError:
    from openclaw_client import openclaw_client

app = FastAPI(title="Fitness Coach Agent")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    user_id: str


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "openclaw_configured": openclaw_client.is_configured(),
    }


@app.post("/chat")
def chat(req: ChatRequest) -> dict:
    response = run_agent(req.message, req.user_id)
    return {"response": response}
