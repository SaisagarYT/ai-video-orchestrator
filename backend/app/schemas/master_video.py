from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class MasterVideoRenderRequest(BaseModel):
    resolution: str = Field(default="1080x1920", description="Target output resolution (e.g. 1080x1920 for 9:16 vertical or 1920x1080 for 16:9)")
    include_audio_mix: bool = Field(default=True, description="Whether to mix background music & voiceover audio tracks")
    transition_type: str = Field(default="crossfade", description="Scene transition mode (crossfade, cut, dissolve)")


class MasterVideoResponse(BaseModel):
    id: UUID
    campaign_id: UUID
    storyboard_id: UUID
    title: str
    aspect_ratio: str
    resolution: str
    duration_seconds: float
    status: str
    storage_path: Optional[str] = None
    url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
