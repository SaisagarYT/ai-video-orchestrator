from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CreativeConcept(Base):
    __tablename__ = "creative_concepts"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    campaign_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    hook: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    concept: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    visual_direction: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    emotional_direction: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    call_to_action: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    estimated_duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    is_selected: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    campaign = relationship(
        "Campaign",
        back_populates="creative_concepts",
    )
