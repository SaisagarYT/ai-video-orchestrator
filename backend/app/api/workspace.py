from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.workspace import (
    CampaignProgressResponse,
    CampaignWorkspaceResponse,
    SceneCreateRequest,
    SceneDetailResponse,
    SceneReorderRequest,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(
    tags=["Campaign Management & User Workspace"],
)

service = WorkspaceService()


@router.get(
    "/campaigns/{campaign_id}/workspace",
    response_model=CampaignWorkspaceResponse,
)
def get_campaign_workspace(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_campaign_workspace(
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
    "/campaigns/{campaign_id}/progress",
    response_model=CampaignProgressResponse,
)
def get_campaign_progress(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_campaign_progress(
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
    "/storyboards/{storyboard_id}/scenes",
    response_model=SceneDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_scene_to_storyboard(
    storyboard_id: UUID,
    request: SceneCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.add_scene(
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


@router.put(
    "/storyboards/{storyboard_id}/scenes/reorder",
    response_model=List[SceneDetailResponse],
)
def reorder_scenes(
    storyboard_id: UUID,
    request: SceneReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.reorder_scenes(
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


@router.delete(
    "/storyboards/{storyboard_id}/scenes/{scene_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_scene(
    storyboard_id: UUID,
    scene_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_scene(
            db=db,
            storyboard_id=storyboard_id,
            scene_id=scene_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/scenes/{scene_id}/assets/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_asset(
    scene_id: UUID,
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_asset(
            db=db,
            scene_id=scene_id,
            asset_id=asset_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
