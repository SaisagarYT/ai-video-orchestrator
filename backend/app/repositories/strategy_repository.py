from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.campaign_strategy import CampaignStrategy
from app.models.creative_concept import CreativeConcept
from app.schemas.concept import CreativeConcept as CreativeConceptSchema
from app.schemas.strategy import MarketingStrategy


class StrategyRepository:

    def save_strategy(
        self,
        db: Session,
        campaign_id: UUID,
        strategy_data: MarketingStrategy,
    ) -> CampaignStrategy:
        existing = (
            db.query(CampaignStrategy)
            .filter(CampaignStrategy.campaign_id == campaign_id)
            .first()
        )

        if existing:
            existing.campaign_objective = strategy_data.campaign_objective
            existing.target_audience = strategy_data.target_audience
            existing.marketing_angle = strategy_data.marketing_angle
            existing.core_message = strategy_data.core_message
            existing.call_to_action = strategy_data.call_to_action
            existing.tone = strategy_data.tone
            existing.recommended_platform = strategy_data.recommended_platform
            existing.recommended_format = strategy_data.recommended_format
            db.commit()
            db.refresh(existing)
            return existing
        else:
            db_strategy = CampaignStrategy(
                campaign_id=campaign_id,
                campaign_objective=strategy_data.campaign_objective,
                target_audience=strategy_data.target_audience,
                marketing_angle=strategy_data.marketing_angle,
                core_message=strategy_data.core_message,
                call_to_action=strategy_data.call_to_action,
                tone=strategy_data.tone,
                recommended_platform=strategy_data.recommended_platform,
                recommended_format=strategy_data.recommended_format,
            )
            db.add(db_strategy)
            db.commit()
            db.refresh(db_strategy)
            return db_strategy

    def get_strategy_by_campaign(
        self,
        db: Session,
        campaign_id: UUID,
    ) -> Optional[CampaignStrategy]:
        return (
            db.query(CampaignStrategy)
            .filter(CampaignStrategy.campaign_id == campaign_id)
            .first()
        )

    def save_concepts(
        self,
        db: Session,
        campaign_id: UUID,
        concepts_data: List[CreativeConceptSchema],
    ) -> List[CreativeConcept]:
        # Clear existing unselected concepts if regenerating
        db.query(CreativeConcept).filter(CreativeConcept.campaign_id == campaign_id).delete()

        db_concepts = []
        for c in concepts_data:
            concept = CreativeConcept(
                campaign_id=campaign_id,
                title=c.title,
                hook=c.hook,
                concept=c.concept,
                visual_direction=c.visual_direction,
                emotional_direction=c.emotional_direction,
                call_to_action=c.call_to_action,
                estimated_duration=c.estimated_duration,
                is_selected=False,
            )
            db.add(concept)
            db_concepts.append(concept)

        db.commit()
        for concept in db_concepts:
            db.refresh(concept)

        return db_concepts

    def get_concepts_by_campaign(
        self,
        db: Session,
        campaign_id: UUID,
    ) -> List[CreativeConcept]:
        return (
            db.query(CreativeConcept)
            .filter(CreativeConcept.campaign_id == campaign_id)
            .order_by(CreativeConcept.created_at.asc())
            .all()
        )

    def get_concept_by_id(
        self,
        db: Session,
        concept_id: UUID,
        campaign_id: UUID,
    ) -> Optional[CreativeConcept]:
        return (
            db.query(CreativeConcept)
            .filter(CreativeConcept.id == concept_id, CreativeConcept.campaign_id == campaign_id)
            .first()
        )

    def select_concept(
        self,
        db: Session,
        campaign_id: UUID,
        concept_id: UUID,
    ) -> CreativeConcept:
        # 1. Reset all concepts for this campaign to unselected
        concepts = db.query(CreativeConcept).filter(CreativeConcept.campaign_id == campaign_id).all()
        selected: Optional[CreativeConcept] = None
        for c in concepts:
            if c.id == concept_id:
                c.is_selected = True
                selected = c
            else:
                c.is_selected = False

        if selected is None:
            raise ValueError("Creative concept not found in campaign")

        db.commit()
        db.refresh(selected)
        return selected
