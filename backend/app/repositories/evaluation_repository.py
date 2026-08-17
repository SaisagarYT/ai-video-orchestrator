from typing import Any, Dict, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.asset_evaluation import AssetEvaluation


class EvaluationRepository:

    def save_evaluation(
        self,
        db: Session,
        asset_id: UUID,
        eval_data: Dict[str, Any],
    ) -> AssetEvaluation:
        existing = (
            db.query(AssetEvaluation)
            .filter(AssetEvaluation.asset_id == asset_id)
            .first()
        )

        if existing:
            existing.product_consistency_score = eval_data["product_consistency_score"]
            existing.brand_consistency_score = eval_data["brand_consistency_score"]
            existing.visual_quality_score = eval_data["visual_quality_score"]
            existing.overall_score = eval_data["overall_score"]
            existing.status = eval_data["status"]
            existing.feedback = eval_data["feedback"]
            existing.suggested_improvements = eval_data["suggested_improvements"]
            db.commit()
            db.refresh(existing)
            return existing

        eval_model = AssetEvaluation(
            asset_id=asset_id,
            product_consistency_score=eval_data["product_consistency_score"],
            brand_consistency_score=eval_data["brand_consistency_score"],
            visual_quality_score=eval_data["visual_quality_score"],
            overall_score=eval_data["overall_score"],
            status=eval_data["status"],
            feedback=eval_data["feedback"],
            suggested_improvements=eval_data["suggested_improvements"],
        )
        db.add(eval_model)
        db.commit()
        db.refresh(eval_model)
        return eval_model

    def get_by_asset_id(
        self,
        db: Session,
        asset_id: UUID,
    ) -> Optional[AssetEvaluation]:
        return (
            db.query(AssetEvaluation)
            .filter(AssetEvaluation.asset_id == asset_id)
            .first()
        )
