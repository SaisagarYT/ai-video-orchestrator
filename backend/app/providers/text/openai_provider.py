from typing import Any, Dict
from app.providers.base import BaseTextProvider


class OpenAITextProvider(BaseTextProvider):
    """
    OpenAI GPT-4o / Reasoning Provider adapter.
    """

    def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        **kwargs,
    ) -> str:
        return f"[OpenAI Response] {prompt}"

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> Dict[str, Any]:
        return {"provider": "openai", "status": "success"}
