from datetime import date, datetime, timezone
from uuid import uuid4

from sqlalchemy import Date, DateTime, Float, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class Trip(Base):
    __tablename__ = "trips"

    owner_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=False),
        nullable=False,
        index=True,
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    destination: Mapped[str] = mapped_column(String(180), index=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    budget: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    travelers: Mapped[int] = mapped_column(Integer, default=1)
    pace: Mapped[str] = mapped_column(String(20), default="Balanced")
    interests: Mapped[list] = mapped_column(JSON, default=list)
    accommodation: Mapped[str] = mapped_column(String(80), default="Flexible")
    itinerary: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )
