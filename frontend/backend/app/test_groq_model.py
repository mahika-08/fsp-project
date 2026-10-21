
import asyncio

from groq import AsyncGroq
from app.config import GROQ_API_KEY, GROQ_MODEL


async def main():
    if not GROQ_API_KEY:
        raise SystemExit("GROQ_API_KEY is missing from backend/.env")

    client = AsyncGroq(api_key=GROQ_API_KEY)

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": 'Return this JSON object: {"status":"ok"}',
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=100,
        )

        print("Model:", GROQ_MODEL)
        print("Response:", response.choices[0].message.content)

    except Exception as exc:
        print(f"Model test failed: {type(exc).__name__}: {exc}")

    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
