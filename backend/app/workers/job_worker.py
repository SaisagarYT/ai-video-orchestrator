from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.core.storage import storage_client
from app.db.session import SessionLocal
from app.models.asset import Asset
from app.models.creative_bible import CreativeBible
from app.models.generation_job import GenerationJob
from app.models.scene import Scene
from app.models.storyboard import Storyboard
from app.orchestration.prompt_compiler import prompt_compiler
from app.orchestration.provider_router import provider_router


class JobWorker:
    """
    Background worker that compiles Creative Bible generation specifications,
    executes media generation jobs via ProviderRouter, uploads assets to MinIO,
    and registers versioned Asset entries in PostgreSQL.
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

            scene = (
                db.query(Scene)
                .options(joinedload(Scene.storyboard).joinedload(Storyboard.creative_bible))
                .filter(Scene.id == job.scene_id)
                .first()
            )
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

            # 3. Compile Generation Specification using Creative Bible rules
            job.progress = 50
            db.commit()

            creative_bible = scene.storyboard.creative_bible if scene.storyboard else None
            aspect_ratio = job.parameters.get("aspect_ratio", "9:16") if job.parameters else "9:16"
            requested_provider = job.parameters.get("provider", "higgsfield") if job.parameters else "higgsfield"
            seed = job.parameters.get("seed", 42) if job.parameters else 42

            spec = prompt_compiler.compile_scene_specification(
                scene=scene,
                creative_bible=creative_bible,
                target_provider=requested_provider,
                aspect_ratio=aspect_ratio,
                seed=seed,
            )

            # Store compiled spec inside job parameters
            updated_params = dict(job.parameters or {})
            updated_params["generation_specification"] = spec.model_dump()
            job.parameters = updated_params
            db.commit()

            # 4. Route Generation through Multi-Modal Provider Router (Higgsfield, Flux, ElevenLabs)
            job.progress = 75
            db.commit()

            job_type = job.job_type or "video_generation"
            media_prompt = spec.compiled_positive_prompt if "video" in job_type or "image" in job_type else scene.audio_narration

            media_bytes, mime_type, actual_provider = provider_router.generate_media_asset(
                job_type=job_type,
                prompt=media_prompt,
                aspect_ratio=spec.aspect_ratio,
                duration_seconds=spec.duration_seconds,
                voice_profile="Professional",
                requested_provider=requested_provider,
            )

            # Determine file extension
            ext = "mp4" if "video" in mime_type else "png" if "image" in mime_type else "mp3"

            # 5. Upload to MinIO Object Storage
            object_key = f"scenes/{scene.id}/v{next_version}_{actual_provider}_render.{ext}"
            media_url = storage_client.upload_bytes(
                object_name=object_key,
                data=media_bytes,
                content_type=mime_type,
            )

            # 6. Create Asset record in PostgreSQL
            is_first_asset = len(existing_assets) == 0
            asset_type = "video" if "video" in mime_type else "image" if "image" in mime_type else "audio"

            asset = Asset(
                user_id=job.user_id,
                scene_id=scene.id,
                job_id=job.id,
                asset_type=asset_type,
                version=next_version,
                storage_path=object_key,
                url=media_url,
                is_selected=is_first_asset,  # auto-select first variation V1
                file_size_bytes=len(media_bytes),
                mime_type=mime_type,
                duration_seconds=scene.duration_seconds if asset_type == "video" else None,
            )
            db.add(asset)

            # 7. Complete Generation Job
            job.status = "completed"
            job.progress = 100
            job.completed_at = datetime.utcnow()

            # 8. Update Scene asset URL if selected
            if is_first_asset:
                if asset_type == "video":
                    scene.video_asset_url = media_url
                elif asset_type == "audio":
                    scene.audio_asset_url = media_url
                scene.status = "completed"

            db.commit()
            db.refresh(asset)
            return asset

        finally:
            db.close()


job_worker = JobWorker()
