from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class MarketingStrategy(BaseModel):
    campaign_objective: str = Field(description="Core objective of the campaign")
    target_audience: str = Field(description="Primary demographic and psychographic audience")
    marketing_angle: str = Field(description="Unique marketing hook or reason to care")
    core_message: str = Field(description="Key takeaway for the viewer")
    call_to_action: str = Field(description="Desired action inspired by the ad")
    tone: str = Field(description="Cinematic tone and brand voice")
    recommended_platform: str = Field(description="Optimal publishing platform, e.g. Instagram Reels")
    recommended_format: str = Field(description="Optimal video format, e.g. Short-form 9:16 vertical video")


class CampaignStrategyResponse(MarketingStrategy):
    id: UUID
    campaign_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
