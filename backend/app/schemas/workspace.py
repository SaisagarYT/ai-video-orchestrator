from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.asset import AssetResponse
from app.schemas.business import BusinessResponse
from app.schemas.campaign import CampaignResponse
from app.schemas.concept import CreativeConceptResponse
from app.schemas.final_video import FinalVideoResponse
from app.schemas.scene import SceneResponse
from app.schemas.storyboard import StoryboardResponse
from app.schemas.strategy import CampaignStrategyResponse


class SceneDetailResponse(SceneResponse):
    assets: List[AssetResponse] = Field(default_factory=list)
    selected_asset: Optional[AssetResponse] = None


class CampaignProgressResponse(BaseModel):
    brief_completed: bool
    strategy_completed: bool
    concept_selected: bool
    storyboard_ready: bool
    scenes_generated: bool
    scenes_generated_count: int
    scenes_total_count: int
    quality_evaluated: bool
    final_rendered: bool
    current_stage: str = Field(description="Stage: BRIEF, STRATEGY, CONCEPTS, STORYBOARD, GENERATION, EVALUATION, RENDER, COMPLETED")
    progress_percentage: int = Field(description="Overall workflow completion percentage from 0 to 100")


class CampaignWorkspaceResponse(BaseModel):
    campaign: CampaignResponse
    business: Optional[BusinessResponse] = None
    strategy: Optional[CampaignStrategyResponse] = None
    concepts: List[CreativeConceptResponse] = Field(default_factory=list)
    selected_concept: Optional[CreativeConceptResponse] = None
    storyboard: Optional[StoryboardResponse] = None
    scenes: List[SceneDetailResponse] = Field(default_factory=list)
    final_videos: List[FinalVideoResponse] = Field(default_factory=list)
    progress: CampaignProgressResponse

    model_config = ConfigDict(from_attributes=True)


class SceneCreateRequest(BaseModel):
    sequence_number: Optional[int] = Field(default=None, description="Optional target position; appends to end if omitted")
    shot_type: str = Field(default="Medium Tracking Shot")
    camera_movement: str = Field(default="Dolly In")
    visual_prompt: str
    audio_narration: str = ""
    duration_seconds: float = 4.0
    lighting_atmosphere: str = "Natural atmospheric commercial lighting"


class SceneReorderRequest(BaseModel):
    scene_ids_in_order: List[UUID] = Field(description="Ordered list of scene UUIDs defining new sequence order")
