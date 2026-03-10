import os
from typing import Optional

import requests


class OpenClawClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("OPENCLAW_BASE_URL", "").rstrip("/")
        self.token = os.getenv("OPENCLAW_GATEWAY_TOKEN")
        self.agent_id = os.getenv("OPENCLAW_AGENT_ID", "main")
        self.timeout = int(os.getenv("OPENCLAW_TIMEOUT_SECONDS", "45"))

    def is_configured(self) -> bool:
        return bool(self.base_url and self.token and self.agent_id)

    def generate_reply(self, user_id: str, message: str, context: Optional[str] = None) -> str:
        if not self.is_configured():
            raise RuntimeError("OpenClaw is not configured.")

        prompt = message if not context else f"{context}\n\nUser message:\n{message}"
        response = requests.post(
            f"{self.base_url}/v1/responses",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            },
            json={
                "model": f"openclaw:{self.agent_id}",
                "input": prompt,
                "metadata": {"user_id": user_id},
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        text = self._extract_text(payload)
        if not text:
            raise RuntimeError("OpenClaw returned no text output.")
        return text

    def _extract_text(self, payload: dict) -> str:
        output = payload.get("output", [])
        chunks = []
        for item in output:
            for content in item.get("content", []):
                if content.get("type") == "output_text" and content.get("text"):
                    chunks.append(content["text"])
        if chunks:
            return "\n".join(chunks).strip()
        if payload.get("output_text"):
            return str(payload["output_text"]).strip()
        return ""


openclaw_client = OpenClawClient()
