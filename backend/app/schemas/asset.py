from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class AssetResponse(BaseModel):
    id: UUID
    user_id: UUID
    scene_id: UUID
    job_id: Optional[UUID] = None
    asset_type: str
    version: int
    storage_path: str
    url: str
    is_selected: bool = False
    file_size_bytes: Optional[int] = None
    mime_type: str
    duration_seconds: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssetSelectResponse(BaseModel):
    message: str
    selected_asset: AssetResponse
    scene_id: UUID
