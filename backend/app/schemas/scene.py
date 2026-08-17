from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class SceneCreate(BaseModel):
    sequence_number: int
    shot_type: str = Field(description="Shot type: ECU, MCU, Wide, Tracking, Macro")
    camera_movement: str = Field(description="Camera movement: Dolly In, Pan, Orbit, Static")
    visual_prompt: str = Field(description="Rich descriptive diffusion/video visual prompt")
    audio_narration: str = Field(description="Exact voiceover script for this shot")
    duration_seconds: float = Field(description="Shot duration in seconds")
    lighting_atmosphere: str = Field(description="Lighting and atmospheric directives")


class SceneUpdate(BaseModel):
    shot_type: str | None = None
    camera_movement: str | None = None
    visual_prompt: str | None = None
    audio_narration: str | None = None
    duration_seconds: float | None = None
    lighting_atmosphere: str | None = None
    status: str | None = None


class SceneResponse(BaseModel):
    id: UUID
    storyboard_id: UUID
    sequence_number: int
    shot_type: str
    camera_movement: str
    visual_prompt: str
    audio_narration: str
    duration_seconds: float
    lighting_atmosphere: str
    status: str
    video_asset_url: str | None = None
    audio_asset_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
