from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class BusinessCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    industry: str = Field(min_length=1, max_length=100)
    description: str | None = None
    website_url: str | None = None
    target_audience: str | None = None
    tone_of_voice: str | None = None
    brand_colors: str | None = None
    brand_guidelines: str | None = None


class BusinessUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    industry: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    website_url: str | None = None
    target_audience: str | None = None
    tone_of_voice: str | None = None
    brand_colors: str | None = None
    brand_guidelines: str | None = None


class BusinessResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    industry: str
    description: str | None = None
    website_url: str | None = None
    target_audience: str | None = None
    tone_of_voice: str | None = None
    brand_colors: str | None = None
    brand_guidelines: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
