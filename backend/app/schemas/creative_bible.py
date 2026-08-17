from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CreativeBibleSchema(BaseModel):
    visual_style: str = Field(description="Cinematographic look, lens type, and grain aesthetic")
    color_palette: str = Field(description="Curated color hex codes and color grading LUT mood")
    lighting_rules: str = Field(description="Key, fill, rim lighting guidelines and diffusion parameters")
    voiceover_profile: str = Field(description="Narrator timbre, pacing, and emotional demeanor")
    music_sound_design: str = Field(description="Background score genre and sound design foley cues")
    negative_prompts: str = Field(description="Negative prompt tokens preventing unwanted artifacts")


class CreativeBibleResponse(CreativeBibleSchema):
    id: UUID
    storyboard_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
