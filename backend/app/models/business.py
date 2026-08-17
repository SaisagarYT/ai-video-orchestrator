import uuid
from datetime import datetime
from typing import List

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Core Business Profile
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    website_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Brand Context
    target_audience: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    tone_of_voice: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    brand_colors: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    brand_guidelines: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    campaigns: Mapped[List["Campaign"]] = relationship(
        "Campaign",
        back_populates="business",
        cascade="all, delete-orphan",
    )
