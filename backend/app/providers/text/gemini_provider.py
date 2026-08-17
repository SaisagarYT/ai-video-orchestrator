from typing import Any, Dict
from app.providers.base import BaseTextProvider


class GeminiTextProvider(BaseTextProvider):
    """
    Google Gemini AI Text Provider adapter for structured strategy and reasoning.
    """

    def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        **kwargs,
    ) -> str:
        return f"[Gemini Response] {prompt}"

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> Dict[str, Any]:
        return {"provider": "gemini", "status": "success"}
