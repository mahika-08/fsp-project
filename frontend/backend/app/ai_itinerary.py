import json
from datetime import timedelta

from openai import OpenAI

from .config import OPENAI_API_KEY, OPENAI_MODEL
from .schemas import ItineraryDay, TripCreate


def generate_ai_itinerary(trip: TripCreate) -> list[ItineraryDay]:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is missing from backend/.env")

    client = OpenAI(api_key=OPENAI_API_KEY)

    number_of_days = (trip.end_date - trip.start_date).days + 1

    prompt = {
        "destination": trip.destination,
        "startDate": trip.start_date.isoformat(),
        "endDate": trip.end_date.isoformat(),
        "numberOfDays": number_of_days,
        "budget": trip.budget,
        "currency": trip.currency,
        "travelers": trip.travelers,
        "pace": trip.pace,
        "interests": trip.interests,
        "accommodation": trip.accommodation,
    }

    completion = client.chat.completions.create(
        model=OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": """
You are a careful travel itinerary planner.

Return one JSON object with a "days" array.
Create exactly the requested number of days, in chronological order.

Each day must contain:
- day_number: integer starting at 1
- date: YYYY-MM-DD
- title: short day title
- activities: array of activities

Each activity must contain:
- id: unique string
- time: time of day as a short string
- title: activity name
- description: useful, concise description
- category: short category such as Food, Culture, or Nature
- cost: estimated cost per activity as a non-negative number
- duration: estimated duration as a short string

Use the requested destination, dates, interests, pace and budget.
Estimate costs in the requested currency. Do not claim reservations
have been made. Avoid inventing precise opening hours or guarantees.
Return JSON only, with no Markdown.
""".strip(),
            },
            {
                "role": "user",
                "content": json.dumps(prompt),
            },
        ],
    )

    content = completion.choices[0].message.content
    if not content:
        raise ValueError("The AI provider returned an empty itinerary.")

    result = json.loads(content)
    raw_days = result.get("days")

    if not isinstance(raw_days, list) or len(raw_days) != number_of_days:
        raise ValueError("The AI provider returned an incorrect number of days.")

    days: list[ItineraryDay] = []

    for index, raw_day in enumerate(raw_days):
        expected_date = trip.start_date + timedelta(days=index)

        raw_day["day_number"] = index + 1
        raw_day["date"] = expected_date.isoformat()

        # Validate and normalize AI output using the existing Pydantic schema.
        days.append(ItineraryDay.model_validate(raw_day))

    return days