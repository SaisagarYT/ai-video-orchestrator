from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class EvaluationRequest(BaseModel):
    auto_regenerate_on_fail: bool = Field(default=False, description="Automatically trigger prompt refinement and generate next version (V2) if score fails threshold")
    strict_threshold: float = Field(default=7.5, description="Passing score threshold between 0.0 and 10.0")


class AssetEvaluationResponse(BaseModel):
    id: UUID
    asset_id: UUID
    product_consistency_score: float = Field(description="Score evaluating representation of product USPs & hero features (0.0-10.0)")
    brand_consistency_score: float = Field(description="Score evaluating adherence to brand color LUT and style guidelines (0.0-10.0)")
    visual_quality_score: float = Field(description="Score evaluating resolution, lighting dynamics, and lack of visual artifacts (0.0-10.0)")
    overall_score: float = Field(description="Combined composite quality score")
    status: str = Field(description="Quality gate verdict: 'pass' or 'fail'")
    feedback: str = Field(description="Diagnostic review of the rendered media")
    suggested_improvements: str = Field(description="Prompt and parameter refinement directives for regeneration")
    regenerated_asset_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
