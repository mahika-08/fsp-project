
from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Generate a JSON-formatted response from an LLM."""
        raise NotImplementedError
