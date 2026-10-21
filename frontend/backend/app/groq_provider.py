from groq import AsyncGroq

from .config import GROQ_API_KEY, GROQ_MODEL
from .llm_provider import LLMProvider


class GroqProvider(LLMProvider):
    def __init__(self) -> None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is missing from backend/.env")

        self.client = AsyncGroq(
            api_key=GROQ_API_KEY,
            timeout=60.0,
            max_retries=2,
        )
        self.model = GROQ_MODEL

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=6000,
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Groq returned an empty response.")

        return content
