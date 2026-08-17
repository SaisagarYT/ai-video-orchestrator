from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Storyboard(Base):
    __tablename__ = "storyboards"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    campaign_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    concept_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("creative_concepts.id", ondelete="CASCADE"),
        nullable=False,
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

    target_duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="draft",
        nullable=False,
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
    campaign = relationship(
        "Campaign",
        back_populates="storyboard",
    )

    concept = relationship(
        "CreativeConcept",
    )

    scenes: Mapped[List["Scene"]] = relationship(
        "Scene",
        back_populates="storyboard",
        cascade="all, delete-orphan",
        order_by="Scene.sequence_number",
    )

    creative_bible: Mapped[Optional["CreativeBible"]] = relationship(
        "CreativeBible",
        back_populates="storyboard",
        uselist=False,
        cascade="all, delete-orphan",
    )

    master_video = relationship(
        "MasterVideo",
        back_populates="storyboard",
        uselist=False,
        cascade="all, delete-orphan",
    )
