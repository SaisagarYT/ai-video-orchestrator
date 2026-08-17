from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseLLMProvider(ABC):

    @abstractmethod
    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Dict[str, Any]:
        """
        Generates structured JSON response based on system and user prompts.
        """
        pass
