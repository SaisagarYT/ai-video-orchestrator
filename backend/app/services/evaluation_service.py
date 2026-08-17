from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.models.asset import Asset
from app.models.campaign import Campaign
from app.models.creative_bible import CreativeBible
from app.models.scene import Scene
from app.models.storyboard import Storyboard
from app.orchestration.evaluation_engine import evaluation_engine
from app.repositories.evaluation_repository import EvaluationRepository
from app.schemas.evaluation import AssetEvaluationResponse, EvaluationRequest
from app.schemas.generation import GenerationJobCreate
from app.services.generation_service import GenerationService


class EvaluationService:

    def __init__(self):
        self.repository = EvaluationRepository()
        self.generation_service = GenerationService()

    def evaluate_asset(
        self,
        db: Session,
        asset_id: UUID,
        user_id: UUID,
        request: EvaluationRequest,
    ) -> AssetEvaluationResponse:
        # 1. Validate Asset & Scene ownership
        asset = (
            db.query(Asset)
            .join(Scene, Asset.scene_id == Scene.id)
            .join(Storyboard, Scene.storyboard_id == Storyboard.id)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Asset.id == asset_id, Campaign.user_id == user_id)
            .first()
        )
        if asset is None:
            raise ValueError("Asset not found or unauthorized")

        scene = (
            db.query(Scene)
            .options(joinedload(Scene.storyboard).joinedload(Storyboard.creative_bible))
            .filter(Scene.id == asset.scene_id)
            .first()
        )
        creative_bible = scene.storyboard.creative_bible if scene and scene.storyboard else None

        # 2. Run Quality Gate Evaluation
        eval_result = evaluation_engine.evaluate_asset(
            asset=asset,
            scene=scene,
            creative_bible=creative_bible,
            threshold=request.strict_threshold,
        )

        # 3. Save Evaluation in PostgreSQL
        evaluation = self.repository.save_evaluation(
            db=db,
            asset_id=asset.id,
            eval_data=eval_result,
        )

        # 4. Check for Auto-Regeneration on Fail
        regenerated_asset_id: Optional[UUID] = None
        if eval_result["status"] == "fail" and request.auto_regenerate_on_fail:
            gen_res = self.generation_service.dispatch_generation_job(
                db=db,
                scene_id=scene.id,
                user_id=user_id,
                request=GenerationJobCreate(
                    job_type=asset.asset_type + "_generation" if asset.asset_type != "video_generation" else "video_generation",
                    parameters={
                        "improved_guidance": eval_result["suggested_improvements"],
                        "seed": 999,
                    },
                ),
            )
            if gen_res.assets:
                regenerated_asset_id = gen_res.assets[-1].id

        return AssetEvaluationResponse(
            id=evaluation.id,
            asset_id=evaluation.asset_id,
            product_consistency_score=evaluation.product_consistency_score,
            brand_consistency_score=evaluation.brand_consistency_score,
            visual_quality_score=evaluation.visual_quality_score,
            overall_score=evaluation.overall_score,
            status=evaluation.status,
            feedback=evaluation.feedback,
            suggested_improvements=evaluation.suggested_improvements,
            regenerated_asset_id=regenerated_asset_id,
            created_at=evaluation.created_at,
            updated_at=evaluation.updated_at,
        )

    def get_evaluation(
        self,
        db: Session,
        asset_id: UUID,
        user_id: UUID,
    ) -> AssetEvaluationResponse:
        asset = (
            db.query(Asset)
            .join(Scene, Asset.scene_id == Scene.id)
            .join(Storyboard, Scene.storyboard_id == Storyboard.id)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Asset.id == asset_id, Campaign.user_id == user_id)
            .first()
        )
        if asset is None:
            raise ValueError("Asset not found or unauthorized")

        evaluation = self.repository.get_by_asset_id(db=db, asset_id=asset_id)
        if evaluation is None:
            raise ValueError("Evaluation has not been performed yet for this asset")

        return AssetEvaluationResponse.model_validate(evaluation)
