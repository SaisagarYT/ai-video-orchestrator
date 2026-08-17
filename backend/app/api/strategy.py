from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.concept import (
    ConceptSelectionResponse,
    StrategyGenerationResponse,
)
from app.services.strategy_service import StrategyService

router = APIRouter(
    prefix="/campaigns",
    tags=["Marketing Strategy & Creative Concepts"],
)

service = StrategyService()


@router.post(
    "/{campaign_id}/strategy",
    response_model=StrategyGenerationResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_campaign_strategy(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.generate_campaign_strategy(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if "incomplete" in str(e) else status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/{campaign_id}/strategy",
    response_model=StrategyGenerationResponse,
)
def get_campaign_strategy(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_strategy_and_concepts(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/{campaign_id}/concepts/{concept_id}/select",
    response_model=ConceptSelectionResponse,
    status_code=status.HTTP_200_OK,
)
def select_creative_concept(
    campaign_id: UUID,
    concept_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.select_concept(
            db=db,
            campaign_id=campaign_id,
            concept_id=concept_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
