from typing import Any, Dict
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.orchestration.concept_engine import CreativeConceptEngine
from app.orchestration.strategy_engine import StrategyEngine
from app.repositories.business_repository import BusinessRepository
from app.repositories.campaign_repository import CampaignRepository
from app.repositories.strategy_repository import StrategyRepository
from app.schemas.concept import (
    ConceptSelectionResponse,
    CreativeConceptResponse,
    StrategyGenerationResponse,
)
from app.schemas.strategy import MarketingStrategy


class StrategyService:

    def __init__(self):
        self.strategy_repository = StrategyRepository()
        self.campaign_repository = CampaignRepository()
        self.business_repository = BusinessRepository()
        self.strategy_engine = StrategyEngine()
        self.concept_engine = CreativeConceptEngine()

    def generate_campaign_strategy(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> StrategyGenerationResponse:
        # 1. Fetch & Validate Campaign Ownership
        campaign = self.campaign_repository.get_campaign_by_id(
            db=db,
            campaign_id=campaign_id,
            user_id=user_id,
        )
        if campaign is None:
            raise ValueError("Campaign not found")

        # 2. Validate Context Completeness
        if not campaign.product_name or not campaign.objective or not campaign.call_to_action:
            raise ValueError("Campaign context is incomplete. Please complete campaign brief before generating strategy.")

        # 3. Fetch Business & Brand Context
        business = self.business_repository.get_business_by_id(
            db=db,
            business_id=campaign.business_id,
            user_id=user_id,
        )
        business_context: Dict[str, Any] = {}
        if business:
            business_context = {
                "name": business.name,
                "industry": business.industry,
                "target_audience": business.target_audience,
                "tone_of_voice": business.tone_of_voice,
                "brand_colors": business.brand_colors,
                "brand_guidelines": business.brand_guidelines,
            }

        campaign_context = {
            "name": campaign.name,
            "product_name": campaign.product_name,
            "product_description": campaign.product_description,
            "unique_selling_points": campaign.unique_selling_points,
            "objective": campaign.objective,
            "target_platforms": campaign.target_platforms,
            "call_to_action": campaign.call_to_action,
        }

        # 4. State transition: strategy_generating
        campaign.status = "strategy_generating"
        db.commit()

        # 5. Generate Marketing Strategy via StrategyEngine
        strategy = self.strategy_engine.generate_strategy(
            business_context=business_context,
            campaign_context=campaign_context,
        )

        # 6. Save Strategy
        db_strategy = self.strategy_repository.save_strategy(
            db=db,
            campaign_id=campaign.id,
            strategy_data=strategy,
        )

        # 7. Generate Creative Concepts via ConceptEngine
        raw_concepts = self.concept_engine.generate_concepts(
            strategy=strategy,
            business_context=business_context,
            campaign_context=campaign_context,
        )

        # 8. Save Concepts
        db_concepts = self.strategy_repository.save_concepts(
            db=db,
            campaign_id=campaign.id,
            concepts_data=raw_concepts,
        )

        # 9. State transition: concept_selection
        campaign.status = "concept_selection"
        db.commit()

        return StrategyGenerationResponse(
            status="concept_selection",
            strategy=MarketingStrategy(
                campaign_objective=db_strategy.campaign_objective,
                target_audience=db_strategy.target_audience,
                marketing_angle=db_strategy.marketing_angle,
                core_message=db_strategy.core_message,
                call_to_action=db_strategy.call_to_action,
                tone=db_strategy.tone,
                recommended_platform=db_strategy.recommended_platform,
                recommended_format=db_strategy.recommended_format,
            ),
            concepts=[CreativeConceptResponse.model_validate(c) for c in db_concepts],
        )

    def get_strategy_and_concepts(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> StrategyGenerationResponse:
        campaign = self.campaign_repository.get_campaign_by_id(
            db=db,
            campaign_id=campaign_id,
            user_id=user_id,
        )
        if campaign is None:
            raise ValueError("Campaign not found")

        strategy = self.strategy_repository.get_strategy_by_campaign(db=db, campaign_id=campaign_id)
        if strategy is None:
            raise ValueError("Strategy has not been generated for this campaign yet")

        concepts = self.strategy_repository.get_concepts_by_campaign(db=db, campaign_id=campaign_id)

        return StrategyGenerationResponse(
            status=campaign.status,
            strategy=MarketingStrategy(
                campaign_objective=strategy.campaign_objective,
                target_audience=strategy.target_audience,
                marketing_angle=strategy.marketing_angle,
                core_message=strategy.core_message,
                call_to_action=strategy.call_to_action,
                tone=strategy.tone,
                recommended_platform=strategy.recommended_platform,
                recommended_format=strategy.recommended_format,
            ),
            concepts=[CreativeConceptResponse.model_validate(c) for c in concepts],
        )

    def select_concept(
        self,
        db: Session,
        campaign_id: UUID,
        concept_id: UUID,
        user_id: UUID,
    ) -> ConceptSelectionResponse:
        # Validate campaign ownership
        campaign = self.campaign_repository.get_campaign_by_id(
            db=db,
            campaign_id=campaign_id,
            user_id=user_id,
        )
        if campaign is None:
            raise ValueError("Campaign not found")

        # Select concept
        selected_concept = self.strategy_repository.select_concept(
            db=db,
            campaign_id=campaign_id,
            concept_id=concept_id,
        )

        # State transition: concept_selected
        campaign.status = "concept_selected"
        db.commit()

        return ConceptSelectionResponse(
            message=f"Successfully selected creative concept '{selected_concept.title}'",
            selected_concept=CreativeConceptResponse.model_validate(selected_concept),
            status="concept_selected",
        )
