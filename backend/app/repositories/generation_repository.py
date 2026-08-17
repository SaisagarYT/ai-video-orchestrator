from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.models.asset import Asset
from app.models.generation_job import GenerationJob
from app.models.scene import Scene


class GenerationRepository:

    def create_job(
        self,
        db: Session,
        user_id: UUID,
        scene_id: UUID,
        job_type: str = "video_generation",
        parameters: Dict[str, Any] | None = None,
    ) -> GenerationJob:
        job = GenerationJob(
            user_id=user_id,
            scene_id=scene_id,
            job_type=job_type,
            parameters=parameters or {},
            status="queued",
            progress=0,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    def get_job_by_id(
        self,
        db: Session,
        job_id: UUID,
        user_id: UUID | None = None,
    ) -> Optional[GenerationJob]:
        query = (
            db.query(GenerationJob)
            .options(joinedload(GenerationJob.assets))
            .filter(GenerationJob.id == job_id)
        )
        if user_id is not None:
            query = query.filter(GenerationJob.user_id == user_id)
        return query.first()

    def get_assets_by_scene(
        self,
        db: Session,
        scene_id: UUID,
        user_id: UUID | None = None,
    ) -> List[Asset]:
        query = db.query(Asset).filter(Asset.scene_id == scene_id)
        if user_id is not None:
            query = query.filter(Asset.user_id == user_id)
        return query.order_by(Asset.version.asc()).all()

    def get_asset_by_id(
        self,
        db: Session,
        asset_id: UUID,
        user_id: UUID | None = None,
    ) -> Optional[Asset]:
        query = db.query(Asset).filter(Asset.id == asset_id)
        if user_id is not None:
            query = query.filter(Asset.user_id == user_id)
        return query.first()

    def select_asset_for_scene(
        self,
        db: Session,
        scene_id: UUID,
        asset_id: UUID,
    ) -> Asset:
        assets = db.query(Asset).filter(Asset.scene_id == scene_id).all()
        selected: Optional[Asset] = None
        for a in assets:
            if a.id == asset_id:
                a.is_selected = True
                selected = a
            else:
                a.is_selected = False

        if selected is None:
            raise ValueError("Asset not found for this scene")

        # Update Scene main video asset URL
        scene = db.query(Scene).filter(Scene.id == scene_id).first()
        if scene:
            scene.video_asset_url = selected.url

        db.commit()
        db.refresh(selected)
        return selected
