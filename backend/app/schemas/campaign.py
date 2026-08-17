from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.business import BusinessResponse


class CampaignCreate(BaseModel):
    business_id: UUID
    name: str = Field(min_length=1, max_length=255)
    product_name: str = Field(min_length=1, max_length=255)
    product_description: str
    unique_selling_points: str | None = None
    objective: str = Field(min_length=1, max_length=100)
    target_platforms: str | None = None
    call_to_action: str = Field(min_length=1, max_length=255)


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    product_name: str | None = Field(default=None, min_length=1, max_length=255)
    product_description: str | None = None
    unique_selling_points: str | None = None
    objective: str | None = Field(default=None, min_length=1, max_length=100)
    target_platforms: str | None = None
    call_to_action: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = None


class CampaignResponse(BaseModel):
    id: UUID
    user_id: UUID
    business_id: UUID
    name: str
    product_name: str
    product_description: str
    unique_selling_points: str | None = None
    objective: str
    target_platforms: str | None = None
    call_to_action: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignDetailResponse(CampaignResponse):
    business: BusinessResponse | None = None
