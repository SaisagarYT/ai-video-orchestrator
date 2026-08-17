from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class RenderRequest(BaseModel):
    resolution: str = Field(default="1080x1920", description="Target render resolution (1080x1920 for 9:16 or 1920x1080 for 16:9)")
    aspect_ratio: str = Field(default="9:16", description="Target aspect ratio: 9:16, 16:9, 1:1")
    fps: int = Field(default=30, description="Video framerate in FPS")


class RenderJobResponse(BaseModel):
    id: UUID
    campaign_id: UUID
    timeline_id: UUID
    status: str
    attempts: int
    progress: int
    output_video_id: Optional[UUID] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
