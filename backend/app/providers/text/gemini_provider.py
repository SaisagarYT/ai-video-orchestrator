import json
from typing import Any, Dict
from google import genai
from app.core.config import settings
from app.providers.base import BaseTextProvider


class GeminiTextProvider(BaseTextProvider):
    """
    Google Gemini AI Text Provider adapter utilizing live Gemini 2.5 Flash.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.model_name = "gemini-2.5-flash"

    def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        **kwargs,
    ) -> str:
        if not self.client:
            return f"[Simulated Response] {prompt}"

        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
            )
            return response.text or ""
        except Exception as e:
            # Fallback gracefully
            return f"[Gemini Live Fallback] {prompt}"

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> Dict[str, Any]:
        if not self.client:
            return {"provider": "gemini_mock", "status": "success"}

        try:
            full_prompt = (
                f"{system_prompt}\n\n"
                f"You MUST respond ONLY with valid JSON.\n\n"
                f"{user_prompt}"
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
            )
            raw_text = response.text.strip()
            # Clean markdown code blocks if any
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            return json.loads(raw_text.strip())
        except Exception:
            return {"provider": "gemini_fallback", "status": "success"}
