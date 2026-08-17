from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class RecentCampaignSummary(BaseModel):
    id: UUID
    name: str
    product_name: str
    status: str
    final_video_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardOverviewResponse(BaseModel):
    total_campaigns: int
    total_rendered_videos: int
    total_scenes_generated: int
    recent_campaigns: List[RecentCampaignSummary] = []
