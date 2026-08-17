from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.creative_bible import CreativeBibleResponse
from app.schemas.scene import SceneResponse


class StoryboardGenerateRequest(BaseModel):
    concept_id: UUID | None = Field(default=None, description="Optional concept ID (defaults to campaign's selected concept)")
    aspect_ratio: str = Field(default="9:16", description="Desired aspect ratio, e.g. 9:16 or 16:9")


class StoryboardResponse(BaseModel):
    id: UUID
    campaign_id: UUID
    concept_id: UUID
    title: str
    aspect_ratio: str
    target_duration: int
    status: str
    scenes: List[SceneResponse] = Field(default_factory=list)
    creative_bible: Optional[CreativeBibleResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
