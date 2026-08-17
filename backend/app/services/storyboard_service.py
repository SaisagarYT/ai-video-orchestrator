from typing import Any, Dict
from uuid import UUID
from sqlalchemy.orm import Session

from app.orchestration.storyboard_engine import StoryboardEngine
from app.repositories.business_repository import BusinessRepository
from app.repositories.campaign_repository import CampaignRepository
from app.repositories.storyboard_repository import StoryboardRepository
from app.repositories.strategy_repository import StrategyRepository
from app.schemas.creative_bible import CreativeBibleResponse
from app.schemas.scene import SceneResponse, SceneUpdate
from app.schemas.storyboard import StoryboardGenerateRequest, StoryboardResponse
from app.schemas.strategy import MarketingStrategy


class StoryboardService:

    def __init__(self):
        self.storyboard_repository = StoryboardRepository()
        self.campaign_repository = CampaignRepository()
        self.business_repository = BusinessRepository()
        self.strategy_repository = StrategyRepository()
        self.storyboard_engine = StoryboardEngine()

    def generate_storyboard(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
        request: StoryboardGenerateRequest,
    ) -> StoryboardResponse:
        # 1. Fetch & Validate Campaign Ownership
        campaign = self.campaign_repository.get_campaign_by_id(
            db=db,
            campaign_id=campaign_id,
            user_id=user_id,
        )
        if campaign is None:
            raise ValueError("Campaign not found")

        # 2. Fetch Strategy
        strategy_model = self.strategy_repository.get_strategy_by_campaign(db=db, campaign_id=campaign.id)
        if strategy_model is None:
            raise ValueError("Marketing strategy not found. Please generate a strategy first.")

        # 3. Fetch Selected Concept (or requested concept_id)
        concept = None
        if request.concept_id:
            concept = self.strategy_repository.get_concept_by_id(
                db=db,
                concept_id=request.concept_id,
                campaign_id=campaign.id,
            )
        else:
            concepts = self.strategy_repository.get_concepts_by_campaign(db=db, campaign_id=campaign.id)
            for c in concepts:
                if c.is_selected:
                    concept = c
                    break
            if concept is None and concepts:
                concept = concepts[0]  # default to first concept if none marked selected

        if concept is None:
            raise ValueError("No creative concept found for this campaign.")

        # 4. Fetch Business Context
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

        strategy = MarketingStrategy(
            campaign_objective=strategy_model.campaign_objective,
            target_audience=strategy_model.target_audience,
            marketing_angle=strategy_model.marketing_angle,
            core_message=strategy_model.core_message,
            call_to_action=strategy_model.call_to_action,
            tone=strategy_model.tone,
            recommended_platform=strategy_model.recommended_platform,
            recommended_format=strategy_model.recommended_format,
        )

        # 5. Generate Creative Bible & Scene Breakdown via StoryboardEngine
        creative_bible_data, scenes_data = self.storyboard_engine.generate_storyboard(
            concept=concept,
            strategy=strategy,
            business_context=business_context,
            campaign_context=campaign_context,
            aspect_ratio=request.aspect_ratio,
        )

        # 6. Save Storyboard, Creative Bible, and Scenes
        db_storyboard = self.storyboard_repository.save_storyboard(
            db=db,
            campaign_id=campaign.id,
            concept_id=concept.id,
            title=f"Storyboard: {concept.title}",
            target_duration=concept.estimated_duration or 20,
            aspect_ratio=request.aspect_ratio,
            creative_bible_data=creative_bible_data,
            scenes_data=scenes_data,
        )

        # 7. Update Campaign Status
        campaign.status = "storyboard_ready"
        db.commit()

        # 8. Reload complete storyboard with relationships
        full_storyboard = self.storyboard_repository.get_storyboard_by_id(db=db, storyboard_id=db_storyboard.id)

        return self._build_storyboard_response(full_storyboard)

    def get_storyboard(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> StoryboardResponse:
        campaign = self.campaign_repository.get_campaign_by_id(
            db=db,
            campaign_id=campaign_id,
            user_id=user_id,
        )
        if campaign is None:
            raise ValueError("Campaign not found")

        storyboard = self.storyboard_repository.get_storyboard_by_campaign(
            db=db,
            campaign_id=campaign_id,
        )
        if storyboard is None:
            raise ValueError("Storyboard not found for this campaign")

        return self._build_storyboard_response(storyboard)

    def update_scene(
        self,
        db: Session,
        storyboard_id: UUID,
        scene_id: UUID,
        user_id: UUID,
        data: SceneUpdate,
    ) -> SceneResponse:
        # Validate storyboard ownership via campaign
        storyboard = self.storyboard_repository.get_storyboard_by_id(db=db, storyboard_id=storyboard_id)
        if storyboard is None:
            raise ValueError("Storyboard not found")

        campaign = self.campaign_repository.get_campaign_by_id(
            db=db,
            campaign_id=storyboard.campaign_id,
            user_id=user_id,
        )
        if campaign is None:
            raise ValueError("Unauthorized to edit scene in this storyboard")

        updated_scene = self.storyboard_repository.update_scene(
            db=db,
            storyboard_id=storyboard_id,
            scene_id=scene_id,
            data=data,
        )

        return SceneResponse.model_validate(updated_scene)

    def _build_storyboard_response(self, storyboard) -> StoryboardResponse:
        scenes = [SceneResponse.model_validate(s) for s in storyboard.scenes]
        creative_bible = (
            CreativeBibleResponse.model_validate(storyboard.creative_bible)
            if storyboard.creative_bible
            else None
        )

        return StoryboardResponse(
            id=storyboard.id,
            campaign_id=storyboard.campaign_id,
            concept_id=storyboard.concept_id,
            title=storyboard.title,
            aspect_ratio=storyboard.aspect_ratio,
            target_duration=storyboard.target_duration,
            status=storyboard.status,
            scenes=scenes,
            creative_bible=creative_bible,
            created_at=storyboard.created_at,
            updated_at=storyboard.updated_at,
        )
