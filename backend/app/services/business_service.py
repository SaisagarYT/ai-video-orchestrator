from uuid import UUID
from sqlalchemy.orm import Session

from app.models.business import Business
from app.repositories.business_repository import BusinessRepository
from app.schemas.business import BusinessCreate, BusinessUpdate


class BusinessService:

    def __init__(self):
        self.repository = BusinessRepository()

    def create_business(
        self,
        db: Session,
        user_id: UUID,
        business: BusinessCreate,
    ) -> Business:
        return self.repository.create_business(
            db=db,
            user_id=user_id,
            business=business,
        )

    def get_business(
        self,
        db: Session,
        business_id: UUID,
        user_id: UUID,
    ) -> Business:
        business = self.repository.get_business_by_id(
            db=db,
            business_id=business_id,
            user_id=user_id,
        )

        if business is None:
            raise ValueError("Business not found")

        return business

    def get_businesses(
        self,
        db: Session,
        user_id: UUID,
    ) -> list[Business]:
        return self.repository.get_all_businesses_by_user(
            db=db,
            user_id=user_id,
        )

    def update_business(
        self,
        db: Session,
        business_id: UUID,
        user_id: UUID,
        data: BusinessUpdate,
    ) -> Business:
        business = self.get_business(db, business_id, user_id=user_id)

        return self.repository.update_business(
            db=db,
            business=business,
            data=data,
        )

    def delete_business(
        self,
        db: Session,
        business_id: UUID,
        user_id: UUID,
    ) -> None:
        business = self.get_business(db, business_id, user_id=user_id)

        self.repository.delete_business(
            db=db,
            business=business,
        )
