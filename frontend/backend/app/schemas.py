from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(word.capitalize() for word in rest)


class APIModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


Interest = Literal[
    "Culture", "Food", "Nature", "Adventure", "Shopping", "Relaxation", "History", "Photography"
]
Pace = Literal["Relaxed", "Balanced", "Packed"]


class Activity(APIModel):
    id: str
    time: str
    title: str
    description: str
    category: str
    cost: float = Field(ge=0)
    duration: str


class ItineraryDay(APIModel):
    day_number: int = Field(ge=1)
    date: date
    title: str
    activities: list[Activity] = Field(default_factory=list)


class TripFields(APIModel):
    destination: str = Field(min_length=1, max_length=180)
    start_date: date
    end_date: date
    budget: float = Field(gt=0, le=100_000_000)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    travelers: int = Field(default=2, ge=1, le=50)
    pace: Pace = "Balanced"
    interests: list[Interest] = Field(default_factory=list, max_length=8)
    accommodation: str = Field(default="Flexible", max_length=80)

    @field_validator("destination")
    @classmethod
    def trim_destination(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Destination cannot be blank")
        return value

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        value = value.strip().upper()
        if not value.isalpha():
            raise ValueError("Currency must be a 3-letter code")
        return value

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("Return date must be on or after departure date")
        if (self.end_date - self.start_date).days + 1 > 14:
            raise ValueError("Trips can be up to 14 days in this version")
        return self


class TripCreate(TripFields):
    pass


class TripUpdate(APIModel):
    destination: str | None = Field(default=None, min_length=1, max_length=180)
    start_date: date | None = None
    end_date: date | None = None
    budget: float | None = Field(default=None, gt=0, le=100_000_000)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    travelers: int | None = Field(default=None, ge=1, le=50)
    pace: Pace | None = None
    interests: list[Interest] | None = Field(default=None, max_length=8)
    accommodation: str | None = Field(default=None, max_length=80)
    itinerary: list[ItineraryDay] | None = None


class TripResponse(TripFields):
    id: str
    created_at: datetime
    itinerary: list[ItineraryDay] = Field(default_factory=list)


class HealthResponse(APIModel):
    status: str
    database: str


class RegenerateDayRequest(BaseModel):
    day_number: int = Field(alias="day_number", ge=1, le=14)
    model_config = ConfigDict(populate_by_name=True)
