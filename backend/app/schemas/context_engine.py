from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ContextAnalyzeRequest(BaseModel):
    prompt: str = Field(min_length=3, description="Raw natural language prompt describing the ad vision or product")
    business_id: UUID | None = Field(default=None, description="Optional existing business profile ID to pre-populate context")
    campaign_id: UUID | None = Field(default=None, description="Optional existing campaign ID")


class ExtractedAttributes(BaseModel):
    product_name: str | None = None
    industry: str | None = None
    target_audience: str | None = None
    tone_of_voice: str | None = None
    unique_selling_points: List[str] | str | None = None
    campaign_objective: str | None = None
    target_platforms: List[str] | str | None = None
    call_to_action: str | None = None
    visual_style_preferences: str | None = None


class ClarificationQuestion(BaseModel):
    id: str
    field: str
    question: str
    suggested_options: List[str] = Field(default_factory=list)
    required: bool = True


class SubmitAnswersRequest(BaseModel):
    answers: Dict[str, str] = Field(description="Dictionary mapping question field or ID to user answer text")


class ContextSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    business_id: UUID | None = None
    campaign_id: UUID | None = None
    raw_input_prompt: str
    extracted_data: Dict[str, Any]
    missing_fields: List[str]
    clarification_questions: List[Dict[str, Any]]
    user_answers: Dict[str, Any]
    complete_context: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
