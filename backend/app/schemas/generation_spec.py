from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class GenerationSpecification(BaseModel):
    scene_id: UUID
    sequence_number: int
    compiled_positive_prompt: str = Field(description="Fully fused broadcast-grade positive diffusion/video prompt")
    compiled_negative_prompt: str = Field(description="Negative prompt tokens preventing visual anomalies")
    shot_type: str
    camera_movement: str
    aspect_ratio: str = "9:16"
    duration_seconds: float = 4.0
    visual_style: str
    color_palette: str
    lighting_directives: str
    target_provider: str = "higgsfield"
    fps: int = 24
    seed: int = 42

    model_config = ConfigDict(from_attributes=True)
