from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MasterVideo(Base):
    __tablename__ = "master_videos"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    campaign_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
    )

    storyboard_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("storyboards.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    aspect_ratio: Mapped[str] = mapped_column(
        String(50),
        default="9:16",
        nullable=False,
    )

    resolution: Mapped[str] = mapped_column(
        String(50),
        default="1080x1920",
        nullable=False,
    )

    duration_seconds: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="queued",
        nullable=False,
    )

    storage_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    file_size_bytes: Mapped[Optional[int]] = mapped_column(
        Integer,
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

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    storyboard = relationship(
        "Storyboard",
        back_populates="master_video",
    )

    campaign = relationship(
        "Campaign",
    )
