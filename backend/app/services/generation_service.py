from typing import List
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.core.redis_client import redis_queue
from app.models.campaign import Campaign
from app.models.creative_bible import CreativeBible
from app.models.scene import Scene
from app.models.storyboard import Storyboard
from app.orchestration.prompt_compiler import prompt_compiler
from app.repositories.generation_repository import GenerationRepository
from app.schemas.asset import AssetResponse, AssetSelectResponse
from app.schemas.generation import GenerationJobCreate, GenerationJobResponse
from app.schemas.generation_spec import GenerationSpecification
from app.workers.job_worker import job_worker


class GenerationService:

    def __init__(self):
        self.repository = GenerationRepository()

    def dispatch_generation_job(
        self,
        db: Session,
        scene_id: UUID,
        user_id: UUID,
        request: GenerationJobCreate,
    ) -> GenerationJobResponse:
        # 1. Validate Scene & Ownership via Storyboard -> Campaign -> User
        scene = (
            db.query(Scene)
            .join(Storyboard, Scene.storyboard_id == Storyboard.id)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Scene.id == scene_id, Campaign.user_id == user_id)
            .first()
        )

        if scene is None:
            raise ValueError("Scene not found or unauthorized")

        # 2. Create Generation Job record in DB
        job = self.repository.create_job(
            db=db,
            user_id=user_id,
            scene_id=scene.id,
            job_type=request.job_type,
            parameters=request.parameters,
        )

        # 3. Enqueue to Redis Task Queue
        redis_queue.enqueue_job({
            "job_id": str(job.id),
            "scene_id": str(scene.id),
            "user_id": str(user_id),
            "job_type": request.job_type,
            "parameters": request.parameters,
        })

        # 4. Trigger Worker Processing
        job_worker.process_job_sync(job.id)

        # 5. Reload completed job with generated asset
        db.expire_all()
        completed_job = self.repository.get_job_by_id(db=db, job_id=job.id, user_id=user_id)

        return GenerationJobResponse(
            id=completed_job.id,
            user_id=completed_job.user_id,
            scene_id=completed_job.scene_id,
            job_type=completed_job.job_type,
            status=completed_job.status,
            progress=completed_job.progress,
            error_message=completed_job.error_message,
            parameters=completed_job.parameters,
            created_at=completed_job.created_at,
            updated_at=completed_job.updated_at,
            completed_at=completed_job.completed_at,
            assets=[AssetResponse.model_validate(a) for a in completed_job.assets],
        )

    def get_scene_specification(
        self,
        db: Session,
        scene_id: UUID,
        user_id: UUID,
        target_provider: str = "higgsfield",
        aspect_ratio: str = "9:16",
    ) -> GenerationSpecification:
        scene = (
            db.query(Scene)
            .options(joinedload(Scene.storyboard).joinedload(Storyboard.creative_bible))
            .join(Storyboard, Scene.storyboard_id == Storyboard.id)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Scene.id == scene_id, Campaign.user_id == user_id)
            .first()
        )
        if scene is None:
            raise ValueError("Scene not found or unauthorized")

        creative_bible = scene.storyboard.creative_bible if scene.storyboard else None

        return prompt_compiler.compile_scene_specification(
            scene=scene,
            creative_bible=creative_bible,
            target_provider=target_provider,
            aspect_ratio=aspect_ratio,
        )

    def get_job_status(
        self,
        db: Session,
        job_id: UUID,
        user_id: UUID,
    ) -> GenerationJobResponse:
        job = self.repository.get_job_by_id(db=db, job_id=job_id, user_id=user_id)
        if job is None:
            raise ValueError("Generation job not found")

        return GenerationJobResponse(
            id=job.id,
            user_id=job.user_id,
            scene_id=job.scene_id,
            job_type=job.job_type,
            status=job.status,
            progress=job.progress,
            error_message=job.error_message,
            parameters=job.parameters,
            created_at=job.created_at,
            updated_at=job.updated_at,
            completed_at=job.completed_at,
            assets=[AssetResponse.model_validate(a) for a in job.assets],
        )

    def get_scene_assets(
        self,
        db: Session,
        scene_id: UUID,
        user_id: UUID,
    ) -> List[AssetResponse]:
        scene = (
            db.query(Scene)
            .join(Storyboard, Scene.storyboard_id == Storyboard.id)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Scene.id == scene_id, Campaign.user_id == user_id)
            .first()
        )
        if scene is None:
            raise ValueError("Scene not found or unauthorized")

        assets = self.repository.get_assets_by_scene(db=db, scene_id=scene_id, user_id=user_id)
        return [AssetResponse.model_validate(a) for a in assets]

    def select_scene_asset(
        self,
        db: Session,
        scene_id: UUID,
        asset_id: UUID,
        user_id: UUID,
    ) -> AssetSelectResponse:
        scene = (
            db.query(Scene)
            .join(Storyboard, Scene.storyboard_id == Storyboard.id)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Scene.id == scene_id, Campaign.user_id == user_id)
            .first()
        )
        if scene is None:
            raise ValueError("Scene not found or unauthorized")

        selected_asset = self.repository.select_asset_for_scene(
            db=db,
            scene_id=scene_id,
            asset_id=asset_id,
        )

        return AssetSelectResponse(
            message=f"Successfully selected Asset V{selected_asset.version} for Scene",
            selected_asset=AssetResponse.model_validate(selected_asset),
            scene_id=scene_id,
        )
