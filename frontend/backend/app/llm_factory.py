
from .config import LLM_PROVIDER
from .groq_provider import GroqProvider
from .llm_provider import LLMProvider


def get_llm_provider() -> LLMProvider:
    if LLM_PROVIDER == "groq":
        return GroqProvider()

    raise RuntimeError(
        f"Unsupported LLM_PROVIDER: {LLM_PROVIDER}"
    )
