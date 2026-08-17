from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.asset import AssetResponse


class GenerationJobCreate(BaseModel):
    job_type: str = Field(default="video_generation", description="Type of generation: video_generation, image_generation, audio_narration")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Custom parameters (seed, motion_bucket_id, fps, etc.)")


class GenerationJobResponse(BaseModel):
    id: UUID
    user_id: UUID
    scene_id: UUID
    job_type: str
    status: str
    progress: int
    error_message: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    assets: List[AssetResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
