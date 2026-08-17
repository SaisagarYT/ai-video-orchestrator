from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.master_video import MasterVideoRenderRequest, MasterVideoResponse
from app.services.timeline_service import TimelineService

router = APIRouter(
    tags=["Timeline Stitching & Master Commercials"],
)

service = TimelineService()


@router.post(
    "/storyboards/{storyboard_id}/render-master",
    response_model=MasterVideoResponse,
    status_code=status.HTTP_200_OK,
)
def render_master_commercial(
    storyboard_id: UUID,
    request: MasterVideoRenderRequest = MasterVideoRenderRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.render_master_commercial(
            db=db,
            storyboard_id=storyboard_id,
            user_id=current_user.id,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/storyboards/{storyboard_id}/master-video",
    response_model=MasterVideoResponse,
)
def get_master_commercial(
    storyboard_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_master_commercial(
            db=db,
            storyboard_id=storyboard_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
