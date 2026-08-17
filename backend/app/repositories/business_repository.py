from uuid import UUID
from sqlalchemy.orm import Session

from app.models.business import Business
from app.schemas.business import BusinessCreate, BusinessUpdate


class BusinessRepository:

    def create_business(
        self,
        db: Session,
        user_id: UUID,
        business: BusinessCreate,
    ) -> Business:
        db_business = Business(
            user_id=user_id,
            name=business.name,
            industry=business.industry,
            description=business.description,
            website_url=business.website_url,
            target_audience=business.target_audience,
            tone_of_voice=business.tone_of_voice,
            brand_colors=business.brand_colors,
            brand_guidelines=business.brand_guidelines,
        )

        db.add(db_business)
        db.commit()
        db.refresh(db_business)

        return db_business

    def get_business_by_id(
        self,
        db: Session,
        business_id: UUID,
        user_id: UUID | None = None,
    ) -> Business | None:
        query = db.query(Business).filter(Business.id == business_id)
        if user_id is not None:
            query = query.filter(Business.user_id == user_id)
        return query.first()

    def get_all_businesses_by_user(
        self,
        db: Session,
        user_id: UUID,
    ) -> list[Business]:
        return db.query(Business).filter(Business.user_id == user_id).all()

    def update_business(
        self,
        db: Session,
        business: Business,
        data: BusinessUpdate,
    ) -> Business:
        update_data = data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(business, key, value)

        db.commit()
        db.refresh(business)

        return business

    def delete_business(
        self,
        db: Session,
        business: Business,
    ) -> None:
        db.delete(business)
        db.commit()
