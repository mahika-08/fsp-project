from datetime import date, timedelta
from uuid import uuid4

from .schemas import Activity, ItineraryDay, TripFields


def build_itinerary(trip: TripFields) -> list[ItineraryDay]:
    """Create a predictable starter itinerary. This is not AI-generated yet."""
    day_count = (trip.end_date - trip.start_date).days + 1
    interest = trip.interests[0].lower() if trip.interests else "local culture"
    templates = [
        [
            ("09:00", "Breakfast nearby", f"Start the day with breakfast and get oriented in {trip.destination}.", "Food", 12, "1 hr"),
            ("11:00", "Explore a local highlight", f"Explore a well-known area of {trip.destination} at a comfortable pace.", "Culture", 0, "2 hrs"),
            ("13:30", "Regional lunch", "Try a regional specialty at a local restaurant.", "Food", 18, "1 hr"),
            ("16:00", "Time for your interests", f"Spend the afternoon focused on {interest}, with room for breaks.", "Explore", 15, "2 hrs"),
        ],
        [
            ("08:30", "Morning walk", "Start early for a quieter walk and comfortable weather.", "Nature", 0, "1 hr"),
            ("10:30", "Signature attraction", f"Visit a signature attraction in {trip.destination}; verify current hours before going.", "Culture", 20, "2 hrs"),
            ("13:00", "Lunch break", "Pause for lunch near your next stop.", "Food", 18, "1 hr"),
            ("15:00", "Wander and discover", "Leave room for a market, gallery, or unexpected discovery.", "Leisure", 10, "2 hrs"),
        ],
        [
            ("09:00", "Slow morning", "Enjoy a leisurely breakfast and choose a nearby walk.", "Leisure", 10, "1 hr"),
            ("10:30", "A deeper local experience", f"Explore a museum, park, workshop, or neighborhood that suits {interest}.", "Experience", 15, "2 hrs"),
            ("13:00", "Taste the region", "Make lunch part of the experience with a local dish or food market.", "Food", 20, "1 hr"),
            ("16:00", "Golden-hour stroll", "Finish with an easy walk and a flexible evening plan.", "Leisure", 0, "1.5 hrs"),
        ],
    ]
    result = []
    for index in range(day_count):
        day_date = trip.start_date + timedelta(days=index)
        activities = [
            Activity(id=f"{index + 1}-{uuid4().hex[:8]}", time=time, title=title,
                     description=description, category=category, cost=cost, duration=duration)
            for time, title, description, category, cost, duration in templates[index % len(templates)]
        ]
        result.append(ItineraryDay(
            day_number=index + 1,
            date=day_date,
            title=["Arrive & explore", "Discover the highlights", "Find your own rhythm"][index % 3],
            activities=activities,
        ))
    return result
