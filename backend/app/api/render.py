from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.final_video import FinalVideoResponse, PresignedUrlResponse
from app.schemas.render_job import RenderJobResponse, RenderRequest
from app.services.render_service import RenderService

router = APIRouter(
    tags=["Video Assembly & Final Advertisement Rendering"],
)

service = RenderService()


@router.post(
    "/storyboards/{storyboard_id}/render",
    response_model=RenderJobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_render_job(
    storyboard_id: UUID,
    request: RenderRequest = RenderRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.dispatch_render_job(
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
    "/render-jobs/{render_job_id}",
    response_model=RenderJobResponse,
)
def get_render_job(
    render_job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_render_job_status(
            db=db,
            render_job_id=render_job_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/campaigns/{campaign_id}/final-videos",
    response_model=List[FinalVideoResponse],
)
def get_campaign_final_videos(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_campaign_final_videos(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/final-videos/{final_video_id}/url",
    response_model=PresignedUrlResponse,
)
def get_final_video_download_url(
    final_video_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_final_video_url(
            db=db,
            final_video_id=final_video_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
