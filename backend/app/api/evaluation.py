from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.evaluation import AssetEvaluationResponse, EvaluationRequest
from app.services.evaluation_service import EvaluationService

router = APIRouter(
    tags=["AI Quality Evaluation & Auto-Regeneration"],
)

service = EvaluationService()


@router.post(
    "/assets/{asset_id}/evaluate",
    response_model=AssetEvaluationResponse,
    status_code=status.HTTP_200_OK,
)
def evaluate_asset_quality(
    asset_id: UUID,
    request: EvaluationRequest = EvaluationRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.evaluate_asset(
            db=db,
            asset_id=asset_id,
            user_id=current_user.id,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/assets/{asset_id}/evaluation",
    response_model=AssetEvaluationResponse,
)
def get_asset_quality_evaluation(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_evaluation(
            db=db,
            asset_id=asset_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
