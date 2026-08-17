from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session

from app.core.storage import storage_client
from app.db.session import SessionLocal
from app.models.asset import Asset
from app.models.generation_job import GenerationJob
from app.models.scene import Scene


class JobWorker:
    """
    Background worker that executes media generation jobs, uploads assets to MinIO,
    and registers versioned Asset entries (V1, V2, V3...) in PostgreSQL.
    """

    def process_job_sync(self, job_id: UUID) -> Asset:
        db: Session = SessionLocal()
        try:
            job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
            if not job:
                raise ValueError("Job not found")

            # 1. Update job to processing
            job.status = "processing"
            job.progress = 25
            db.commit()

            scene = db.query(Scene).filter(Scene.id == job.scene_id).first()
            if not scene:
                raise ValueError("Scene not found")

            # 2. Determine next asset version (V1, V2, V3...)
            existing_assets = (
                db.query(Asset)
                .filter(Asset.scene_id == scene.id)
                .order_by(Asset.version.desc())
                .all()
            )
            next_version = (existing_assets[0].version + 1) if existing_assets else 1

            # 3. Simulate AI Provider Media Generation & Synthetic Video File Buffer
            job.progress = 60
            db.commit()

            # Create a mock valid MP4 header/data buffer for the generated asset
            mock_video_bytes = (
                b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42\x00\x00\x00\x08free"
                + f"AI_RENDER_SCENE_{scene.sequence_number}_V{next_version}_PROMPT_{scene.visual_prompt[:30]}".encode()
            )

            # 4. Upload to MinIO Object Storage
            object_key = f"scenes/{scene.id}/v{next_version}_render.mp4"
            media_url = storage_client.upload_bytes(
                object_name=object_key,
                data=mock_video_bytes,
                content_type="video/mp4",
            )

            # 5. Create Asset record in PostgreSQL
            is_first_asset = len(existing_assets) == 0
            asset = Asset(
                user_id=job.user_id,
                scene_id=scene.id,
                job_id=job.id,
                asset_type="video",
                version=next_version,
                storage_path=object_key,
                url=media_url,
                is_selected=is_first_asset,  # auto-select first variation V1
                file_size_bytes=len(mock_video_bytes),
                mime_type="video/mp4",
                duration_seconds=scene.duration_seconds,
            )
            db.add(asset)

            # 6. Complete Generation Job
            job.status = "completed"
            job.progress = 100
            job.completed_at = datetime.utcnow()

            # 7. Update Scene asset URL if selected
            if is_first_asset:
                scene.video_asset_url = media_url
                scene.status = "completed"

            db.commit()
            db.refresh(asset)
            return asset

        finally:
            db.close()


job_worker = JobWorker()
