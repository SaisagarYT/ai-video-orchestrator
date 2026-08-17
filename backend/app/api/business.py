from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.business import (
    BusinessCreate,
    BusinessResponse,
    BusinessUpdate,
)
from app.services.business_service import BusinessService

router = APIRouter(
    prefix="/businesses",
    tags=["Businesses"],
)

service = BusinessService()


@router.post(
    "/",
    response_model=BusinessResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_business(
    business: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_business(
        db=db,
        user_id=current_user.id,
        business=business,
    )


@router.get(
    "/",
    response_model=list[BusinessResponse],
)
def get_businesses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_businesses(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/{business_id}",
    response_model=BusinessResponse,
)
def get_business(
    business_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_business(
            db=db,
            business_id=business_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch(
    "/{business_id}",
    response_model=BusinessResponse,
)
def update_business(
    business_id: UUID,
    data: BusinessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_business(
            db=db,
            business_id=business_id,
            user_id=current_user.id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/{business_id}",
    status_code=status.HTTP_200_OK,
)
def delete_business(
    business_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_business(
            db=db,
            business_id=business_id,
            user_id=current_user.id,
        )
        return {"message": "Business deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
