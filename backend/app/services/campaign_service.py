from uuid import UUID
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.repositories.business_repository import BusinessRepository
from app.repositories.campaign_repository import CampaignRepository
from app.schemas.campaign import CampaignCreate, CampaignUpdate


class CampaignService:

    def __init__(self):
        self.repository = CampaignRepository()
        self.business_repository = BusinessRepository()

    def create_campaign(
        self,
        db: Session,
        user_id: UUID,
        campaign: CampaignCreate,
    ) -> Campaign:
        # Validate that business exists and belongs to the user
        business = self.business_repository.get_business_by_id(
            db=db,
            business_id=campaign.business_id,
            user_id=user_id,
        )

        if business is None:
            raise ValueError("Business profile not found")

        return self.repository.create_campaign(
            db=db,
            user_id=user_id,
            campaign=campaign,
        )

    def get_campaign(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> Campaign:
        campaign = self.repository.get_campaign_by_id(
            db=db,
            campaign_id=campaign_id,
            user_id=user_id,
        )

        if campaign is None:
            raise ValueError("Campaign not found")

        return campaign

    def get_campaigns(
        self,
        db: Session,
        user_id: UUID,
        business_id: UUID | None = None,
    ) -> list[Campaign]:
        if business_id is not None:
            # Verify business ownership
            business = self.business_repository.get_business_by_id(
                db=db,
                business_id=business_id,
                user_id=user_id,
            )
            if business is None:
                raise ValueError("Business profile not found")

            return self.repository.get_campaigns_by_business(
                db=db,
                business_id=business_id,
                user_id=user_id,
            )

        return self.repository.get_all_campaigns_by_user(
            db=db,
            user_id=user_id,
        )

    def update_campaign(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
        data: CampaignUpdate,
    ) -> Campaign:
        campaign = self.get_campaign(db, campaign_id, user_id=user_id)

        return self.repository.update_campaign(
            db=db,
            campaign=campaign,
            data=data,
        )

    def delete_campaign(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> None:
        campaign = self.get_campaign(db, campaign_id, user_id=user_id)

        self.repository.delete_campaign(
            db=db,
            campaign=campaign,
        )
