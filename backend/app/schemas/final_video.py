from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class FinalVideoResponse(BaseModel):
    id: UUID
    campaign_id: UUID
    render_job_id: Optional[UUID] = None
    version: int
    duration: float
    resolution: str
    aspect_ratio: str
    fps: int
    status: str
    storage_path: str
    url: str
    file_size_bytes: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PresignedUrlResponse(BaseModel):
    id: UUID
    version: int
    download_url: str
    expires_in_seconds: int = 3600
