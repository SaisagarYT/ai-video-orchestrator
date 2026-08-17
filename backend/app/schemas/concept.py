from datetime import datetime
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.strategy import MarketingStrategy


class CreativeConcept(BaseModel):
    title: str = Field(description="Concept title / working headline")
    hook: str = Field(description="First 3-second opening hook")
    concept: str = Field(description="Narrative arc and visual storytelling concept")
    visual_direction: str = Field(description="Cinematography, lighting, lens, and pacing style")
    emotional_direction: str = Field(description="Intended emotional journey of the viewer")
    call_to_action: str = Field(description="Call-to-action closing line")
    estimated_duration: int = Field(description="Estimated duration in seconds (15-60s)")


class CreativeConceptResponse(CreativeConcept):
    id: UUID
    campaign_id: UUID
    is_selected: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StrategyGenerationResponse(BaseModel):
    status: str
    strategy: MarketingStrategy
    concepts: List[CreativeConceptResponse]


class ConceptSelectionResponse(BaseModel):
    message: str
    selected_concept: CreativeConceptResponse
    status: str = "concept_selected"
