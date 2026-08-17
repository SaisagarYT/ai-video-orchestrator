from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CampaignStrategy(Base):
    __tablename__ = "campaign_strategies"

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

    campaign_objective: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    target_audience: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    marketing_angle: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    core_message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    call_to_action: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    tone: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    recommended_platform: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    recommended_format: Mapped[str] = mapped_column(
        Text,
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

    campaign = relationship(
        "Campaign",
        back_populates="strategy",
    )
