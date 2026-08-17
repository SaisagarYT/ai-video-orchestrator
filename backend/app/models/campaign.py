import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Campaign(Base):
    __tablename__ = "campaigns"

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

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Campaign Identity & Brief
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    product_description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    unique_selling_points: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    objective: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    target_platforms: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    call_to_action: Mapped[str] = mapped_column(
        String(255),
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
    business: Mapped["Business"] = relationship(
        "Business",
        back_populates="campaigns",
    )

    strategy: Mapped[Optional["CampaignStrategy"]] = relationship(
        "CampaignStrategy",
        back_populates="campaign",
        uselist=False,
        cascade="all, delete-orphan",
    )

    creative_concepts: Mapped[List["CreativeConcept"]] = relationship(
        "CreativeConcept",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    storyboard = relationship(
        "Storyboard",
        back_populates="campaign",
        uselist=False,
        cascade="all, delete-orphan",
    )

    final_videos: Mapped[List["FinalVideo"]] = relationship(
        "FinalVideo",
        back_populates="campaign",
        cascade="all, delete-orphan",
        order_by="FinalVideo.version.asc()",
    )
