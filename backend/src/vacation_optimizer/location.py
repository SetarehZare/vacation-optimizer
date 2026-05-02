import json
import logging

import httpx
from pydantic import BaseModel

from vacation_optimizer.config import Settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a location parser. Given a location description, "
    "return ONLY a JSON object with keys: "
    '"country" (full name), "country_code" (ISO 3166-1 alpha-2), '
    '"region" (state/province or null). No prose, no markdown fences.'
)


class ParsedLocation(BaseModel):
    country: str
    country_code: str
    region: str | None = None


async def parse_location(text: str, settings: Settings) -> ParsedLocation:
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        "stream": False,
        "temperature": 0,
    }

    logger.info("Parsing location: %r", text)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.ollama_base_url}/v1/chat/completions",
            json=payload,
            timeout=30.0,
        )
        response.raise_for_status()

    raw = response.json()["choices"][0]["message"]["content"].strip()

    # Strip accidental markdown code fences
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    data = json.loads(raw)
    return ParsedLocation.model_validate(data)
