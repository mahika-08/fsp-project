
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise SystemExit(
        "GROQ_API_KEY is missing. Check backend/.env."
    )

client = Groq(api_key=api_key)

try:
    response = client.models.list()

    print("\nModels returned by Groq:\n")
    for model in response.data:
        print(model.id)

except Exception as exc:
    print(f"Could not list Groq models: {type(exc).__name__}: {exc}")
