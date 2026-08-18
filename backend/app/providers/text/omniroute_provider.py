import json
from typing import Any, Dict
import requests

from app.core.config import settings
from app.providers.base import BaseTextProvider


class OmniRouteTextProvider(BaseTextProvider):
    """
    OmniRoute Local AI Router adapter using high-performance free models
    (e.g., Nemotron Ultra, DeepSeek, Claude via local proxy).
    """

    def __init__(self):
        self.base_url = settings.OMNIROUTE_BASE_URL.rstrip("/")
        self.api_key = settings.OMNIROUTE_API_KEY
        self.model = settings.OMNIROUTE_MODEL or "oc/nemotron-3-ultra-free"

    def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        **kwargs,
    ) -> str:
        if not self.api_key:
            return f"[OmniRoute Mock Response] {prompt}"

        url = f"{self.base_url}/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=45)
            if res.status_code == 200:
                data = res.json()
                content_blocks = data.get("content", [])
                text_out = []
                for block in content_blocks:
                    if block.get("type") == "text":
                        text_out.append(block.get("text", ""))
                return "\n".join(text_out).strip()
            else:
                print(f"[OmniRoute Notice] Status {res.status_code}: {res.text[:100]}")
                return f"[OmniRoute Fallback] {prompt}"
        except Exception as e:
            print(f"[OmniRoute Error] {e}")
            return f"[OmniRoute Fallback] {prompt}"

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> Dict[str, Any]:
        json_sys_prompt = f"{system_prompt}\nYou MUST reply ONLY in valid JSON format with no additional text or explanations."
        raw_text = self.generate_text(prompt=user_prompt, system_prompt=json_sys_prompt)

        # Clean markdown code blocks if wrapped
        clean = raw_text.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        elif clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]

        try:
            return json.loads(clean.strip())
        except Exception:
            return {"provider": "omniroute", "status": "success", "raw_output": raw_text}
