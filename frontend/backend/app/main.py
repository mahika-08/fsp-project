from datetime import timedelta
from uuid import uuid4
from .auth import get_current_user
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from .ai_itinerary import generate_ai_itinerary
from .config import FRONTEND_ORIGINS
from .database import Base, engine, get_db
from . import models
from .itinerary import build_itinerary
from .schemas import (
    HealthResponse, ItineraryDay, RegenerateDayRequest, TripCreate, TripResponse, TripUpdate,
)
import logging

logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Personalized Travel Planner API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


def trip_response(trip: models.Trip) -> TripResponse:
    return TripResponse.model_validate({
        "id": trip.id,
        "destination": trip.destination,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "budget": trip.budget,
        "currency": trip.currency,
        "travelers": trip.travelers,
        "pace": trip.pace,
        "interests": trip.interests or [],
        "accommodation": trip.accommodation,
        "created_at": trip.created_at,
        "itinerary": trip.itinerary or [],
    })


def get_trip_or_404(
    trip_id: str,
    db: Session,
    user_id: str,
) -> models.Trip:
    trip = (
        db.query(models.Trip)
        .filter(
            models.Trip.id == trip_id,
            models.Trip.owner_id == user_id,
        )
        .first()
    )

    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")

    return trip


@app.get("/api/v1/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database connection failed") from exc
    return {"status": "ok", "database": "connected"}


@app.get("/api/v1/trips", response_model=list[TripResponse])
def list_trips(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    trips = (
        db.query(models.Trip)
        .filter(models.Trip.owner_id == current_user["id"])
        .order_by(models.Trip.created_at.desc())
        .all()
    )
    return [trip_response(trip) for trip in trips]


@app.post(
    "/api/v1/trips",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
)




async def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    data = payload.model_dump()
    try:
        generated_days = await generate_ai_itinerary(payload)
    except Exception as exc:
        logger.exception("AI itinerary generation failed")
        raise HTTPException(
            status_code=502,
            detail="AI itinerary generation failed. Check the backend terminal for details.",
        ) from exc

    itinerary = [
        day.model_dump(mode="json", by_alias=True)
        for day in generated_days
    ]

    trip = models.Trip(
        **data,
        itinerary=itinerary,
        owner_id=current_user["id"],
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip_response(trip)


@app.get("/api/v1/trips/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return trip_response(get_trip_or_404(trip_id, db, current_user["id"]))


@app.patch("/api/v1/trips/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: str, payload: TripUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    trip = get_trip_or_404(trip_id, db, current_user["id"])
    changes = payload.model_dump(exclude_unset=True)
    # JSON-mode serialization converts dates to strings and preserves frontend camelCase keys.
    if "itinerary" in changes and changes["itinerary"] is not None:
        changes["itinerary"] = [
            day.model_dump(mode="json", by_alias=True) for day in payload.itinerary or []
        ]
    candidate_start = changes.get("start_date", trip.start_date)
    candidate_end = changes.get("end_date", trip.end_date)
    if candidate_end < candidate_start:
        raise HTTPException(status_code=422, detail="Return date must be on or after departure date")
    if (candidate_end - candidate_start).days + 1 > 14:
        raise HTTPException(status_code=422, detail="Trips can be up to 14 days in this version")
    if "destination" in changes:
        changes["destination"] = changes["destination"].strip()
        if not changes["destination"]:
            raise HTTPException(status_code=422, detail="Destination cannot be blank")
    if "currency" in changes and changes["currency"]:
        changes["currency"] = changes["currency"].upper()
    for field, value in changes.items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip_response(trip)


@app.delete("/api/v1/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    trip = get_trip_or_404(trip_id, db, current_user["id"])
    db.delete(trip)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/v1/trips/{trip_id}/regenerate-day", response_model=TripResponse)
async def regenerate_day(trip_id: str, payload: RegenerateDayRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    trip = get_trip_or_404(trip_id, db, current_user["id"])
    if payload.day_number > (trip.end_date - trip.start_date).days + 1:
        raise HTTPException(status_code=422, detail="Day number is outside this trip's date range")
    trip_fields = TripCreate(
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        budget=trip.budget,
        currency=trip.currency,
        travelers=trip.travelers,
        pace=trip.pace,
        interests=trip.interests or [],
        accommodation=trip.accommodation,
    )
    try:
        fresh_day = await generate_ai_itinerary(trip_fields)[payload.day_number - 1]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not regenerate this day. Please try again.",
        ) from exc
    itinerary = list(trip.itinerary or [])
    while len(itinerary) < payload.day_number:
        itinerary.append(fresh_day.model_dump(mode="json", by_alias=True))
    itinerary[payload.day_number - 1] = fresh_day.model_dump(mode="json", by_alias=True)
    trip.itinerary = itinerary
    db.commit()
    db.refresh(trip)
    return trip_response(trip)
