from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.campaign import (
    CampaignCreate,
    CampaignDetailResponse,
    CampaignResponse,
    CampaignUpdate,
)
from app.services.campaign_service import CampaignService

router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"],
)

service = CampaignService()


@router.post(
    "/",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_campaign(
            db=db,
            user_id=current_user.id,
            campaign=campaign,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[CampaignResponse],
)
def get_campaigns(
    business_id: UUID | None = Query(default=None, description="Filter campaigns by business profile ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_campaigns(
            db=db,
            user_id=current_user.id,
            business_id=business_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/{campaign_id}",
    response_model=CampaignDetailResponse,
)
def get_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_campaign(
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
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def update_campaign(
    campaign_id: UUID,
    data: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_campaign(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/{campaign_id}",
    status_code=status.HTTP_200_OK,
)
def delete_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_campaign(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
        )
        return {"message": "Campaign deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
