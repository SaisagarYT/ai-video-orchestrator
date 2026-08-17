from datetime import datetime
from typing import Any, Dict
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class TimelineCreate(BaseModel):
    resolution: str = Field(default="1080x1920", description="Target video resolution, e.g. 1080x1920 or 1920x1080")
    aspect_ratio: str = Field(default="9:16", description="Target aspect ratio: 9:16, 16:9, 1:1")
    fps: int = Field(default=30, description="Video framerate in FPS")


class TimelineResponse(BaseModel):
    id: UUID
    campaign_id: UUID
    storyboard_id: UUID
    duration: float
    resolution: str
    aspect_ratio: str
    fps: int
    tracks: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
