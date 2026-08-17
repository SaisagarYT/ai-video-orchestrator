from uuid import UUID
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.schemas.campaign import CampaignCreate, CampaignUpdate


class CampaignRepository:

    def create_campaign(
        self,
        db: Session,
        user_id: UUID,
        campaign: CampaignCreate,
    ) -> Campaign:
        db_campaign = Campaign(
            user_id=user_id,
            business_id=campaign.business_id,
            name=campaign.name,
            product_name=campaign.product_name,
            product_description=campaign.product_description,
            unique_selling_points=campaign.unique_selling_points,
            objective=campaign.objective,
            target_platforms=campaign.target_platforms,
            call_to_action=campaign.call_to_action,
        )

        db.add(db_campaign)
        db.commit()
        db.refresh(db_campaign)

        return db_campaign

    def get_campaign_by_id(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID | None = None,
    ) -> Campaign | None:
        query = db.query(Campaign).filter(Campaign.id == campaign_id)
        if user_id is not None:
            query = query.filter(Campaign.user_id == user_id)
        return query.first()

    def get_all_campaigns_by_user(
        self,
        db: Session,
        user_id: UUID,
    ) -> list[Campaign]:
        return db.query(Campaign).filter(Campaign.user_id == user_id).all()

    def get_campaigns_by_business(
        self,
        db: Session,
        business_id: UUID,
        user_id: UUID,
    ) -> list[Campaign]:
        return (
            db.query(Campaign)
            .filter(Campaign.business_id == business_id, Campaign.user_id == user_id)
            .all()
        )

    def update_campaign(
        self,
        db: Session,
        campaign: Campaign,
        data: CampaignUpdate,
    ) -> Campaign:
        update_data = data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(campaign, key, value)

        db.commit()
        db.refresh(campaign)

        return campaign

    def delete_campaign(
        self,
        db: Session,
        campaign: Campaign,
    ) -> None:
        db.delete(campaign)
        db.commit()
