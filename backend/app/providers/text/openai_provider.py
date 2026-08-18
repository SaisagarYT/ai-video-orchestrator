import json
from typing import Any, Dict
from openai import OpenAI

from app.core.config import settings
from app.providers.base import BaseTextProvider


class OpenAITextProvider(BaseTextProvider):
    """
    OpenAI GPT-4o / GPT-4o-mini Marketing Intelligence & Scriptwriting Provider.
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        self.model_name = "gpt-4o-mini"

    def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        **kwargs,
    ) -> str:
        if not self.client:
            return f"[Simulated Response] {prompt}"

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"[OpenAI Text Warning] {e}")
            return f"[OpenAI Fallback] {prompt}"

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> Dict[str, Any]:
        if not self.client:
            return {"provider": "openai_mock", "status": "success"}

        try:
            messages = []
            sys_msg = (system_prompt + "\nRespond ONLY in valid JSON format.") if system_prompt else "Respond ONLY in valid JSON format."
            messages.append({"role": "system", "content": sys_msg})
            messages.append({"role": "user", "content": user_prompt})

            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            raw = response.choices[0].message.content or "{}"
            return json.loads(raw)
        except Exception as e:
            print(f"[OpenAI JSON Warning] {e}")
            return {"provider": "openai_fallback", "status": "success"}

