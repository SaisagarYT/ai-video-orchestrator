from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CreativeBible(Base):
    __tablename__ = "creative_bibles"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    storyboard_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("storyboards.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    visual_style: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    color_palette: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    lighting_rules: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    voiceover_profile: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    music_sound_design: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    negative_prompts: Mapped[str] = mapped_column(
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

    # Relationships
    storyboard = relationship(
        "Storyboard",
        back_populates="creative_bible",
    )
