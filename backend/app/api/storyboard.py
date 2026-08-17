from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.scene import SceneResponse, SceneUpdate
from app.schemas.storyboard import StoryboardGenerateRequest, StoryboardResponse
from app.services.storyboard_service import StoryboardService

router = APIRouter(
    tags=["Storyboard & Creative Bible"],
)

service = StoryboardService()


@router.post(
    "/campaigns/{campaign_id}/storyboard",
    response_model=StoryboardResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_campaign_storyboard(
    campaign_id: UUID,
    request: StoryboardGenerateRequest = StoryboardGenerateRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.generate_storyboard(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/campaigns/{campaign_id}/storyboard",
    response_model=StoryboardResponse,
)
def get_campaign_storyboard(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_storyboard(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch(
    "/storyboards/{storyboard_id}/scenes/{scene_id}",
    response_model=SceneResponse,
)
def update_storyboard_scene(
    storyboard_id: UUID,
    scene_id: UUID,
    data: SceneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_scene(
            db=db,
            storyboard_id=storyboard_id,
            scene_id=scene_id,
            user_id=current_user.id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
