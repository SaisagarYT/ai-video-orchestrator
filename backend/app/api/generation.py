from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.asset import AssetResponse, AssetSelectResponse
from app.schemas.generation import GenerationJobCreate, GenerationJobResponse
from app.schemas.generation_spec import GenerationSpecification
from app.services.generation_service import GenerationService

router = APIRouter(
    tags=["Generation Jobs & Media Assets"],
)

service = GenerationService()


@router.post(
    "/scenes/{scene_id}/generate",
    response_model=GenerationJobResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_scene_asset(
    scene_id: UUID,
    request: GenerationJobCreate = GenerationJobCreate(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.dispatch_generation_job(
            db=db,
            scene_id=scene_id,
            user_id=current_user.id,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/scenes/{scene_id}/specification",
    response_model=GenerationSpecification,
)
def get_scene_generation_specification(
    scene_id: UUID,
    target_provider: str = Query(default="higgsfield"),
    aspect_ratio: str = Query(default="9:16"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_scene_specification(
            db=db,
            scene_id=scene_id,
            user_id=current_user.id,
            target_provider=target_provider,
            aspect_ratio=aspect_ratio,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/jobs/{job_id}",
    response_model=GenerationJobResponse,
)
def get_generation_job_status(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_job_status(
            db=db,
            job_id=job_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/scenes/{scene_id}/assets",
    response_model=List[AssetResponse],
)
def get_scene_assets(
    scene_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_scene_assets(
            db=db,
            scene_id=scene_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/scenes/{scene_id}/assets/{asset_id}/select",
    response_model=AssetSelectResponse,
    status_code=status.HTTP_200_OK,
)
def select_scene_asset(
    scene_id: UUID,
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.select_scene_asset(
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
