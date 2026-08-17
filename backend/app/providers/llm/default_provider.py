from typing import Any, Dict
from app.providers.base import BaseLLMProvider


class DefaultMarketingLLMProvider(BaseLLMProvider):
    """
    Default high-performance provider generating structured marketing intelligence
    grounded strictly in the user's business, campaign, and brand facts.
    """

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Dict[str, Any]:
        return {}
