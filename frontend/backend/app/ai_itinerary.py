
import json
from datetime import timedelta

from .llm_factory import get_llm_provider
from .prompts import ITINERARY_SYSTEM_PROMPT, build_itinerary_prompt
from .schemas import ItineraryDay, TripCreate


async def generate_ai_itinerary(
    trip: TripCreate,
) -> list[ItineraryDay]:
    number_of_days = (trip.end_date - trip.start_date).days + 1

    if number_of_days < 1 or number_of_days > 14:
        raise ValueError("Trip duration must be between 1 and 14 days.")

    provider = get_llm_provider()

    content = await provider.generate_json(
        system_prompt=ITINERARY_SYSTEM_PROMPT,
        user_prompt=build_itinerary_prompt(trip),
    )

    try:
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError("The AI returned invalid JSON.") from exc

    raw_days = result.get("days") if isinstance(result, dict) else None

    if not isinstance(raw_days, list) or len(raw_days) != number_of_days:
        raise ValueError("The AI returned an incorrect number of days.")

    validated_days: list[ItineraryDay] = []

    for index, raw_day in enumerate(raw_days):
        if not isinstance(raw_day, dict):
            raise ValueError("The AI returned an invalid itinerary day.")

        raw_day["day_number"] = index + 1
        raw_day["date"] = (
            trip.start_date + timedelta(days=index)
        ).isoformat()

        validated_days.append(ItineraryDay.model_validate(raw_day))

    return validated_days
