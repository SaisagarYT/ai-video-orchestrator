from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session

from app.core.storage import storage_client
from app.db.session import SessionLocal
from app.models.campaign import Campaign
from app.models.final_video import FinalVideo
from app.models.render_job import RenderJob
from app.models.timeline import Timeline
from app.services.video_renderer import video_renderer


class RenderWorker:
    """
    Background worker that picks up queued RenderJobs, executes FFmpeg rendering,
    uploads final advertisements to MinIO, and creates versioned FinalVideo records.
    """

    def process_render_job_sync(self, render_job_id: UUID) -> FinalVideo:
        db: Session = SessionLocal()
        try:
            job = db.query(RenderJob).filter(RenderJob.id == render_job_id).first()
            if not job:
                raise ValueError("Render job not found")

            # 1. Transition to PROCESSING
            job.status = "PROCESSING"
            job.progress = 25
            db.commit()

            timeline = db.query(Timeline).filter(Timeline.id == job.timeline_id).first()
            if not timeline:
                job.status = "FAILED"
                job.error_message = "Timeline not found"
                db.commit()
                raise ValueError("Timeline not found")

            # 2. Execute FFmpeg Rendering Pipeline
            job.progress = 60
            db.commit()

            timeline_data = {
                "duration": timeline.duration,
                "resolution": timeline.resolution,
                "aspect_ratio": timeline.aspect_ratio,
                "fps": timeline.fps,
                "tracks": timeline.tracks,
            }

            master_bytes, duration, file_size, resolution = video_renderer.render_timeline(timeline_data)

            # 3. Determine next Final Video version (v1, v2, v3...)
            existing_videos = (
                db.query(FinalVideo)
                .filter(FinalVideo.campaign_id == job.campaign_id)
                .order_by(FinalVideo.version.desc())
                .all()
            )
            next_version = (existing_videos[0].version + 1) if existing_videos else 1

            # 4. Upload Final Advertisement to MinIO
            object_key = f"campaigns/{job.campaign_id}/final/version-{next_version:03d}.mp4"
            media_url = storage_client.upload_bytes(
                object_name=object_key,
                data=master_bytes,
                content_type="video/mp4",
            )

            # 5. Create FinalVideo record
            final_video = FinalVideo(
                campaign_id=job.campaign_id,
                render_job_id=job.id,
                version=next_version,
                duration=duration,
                resolution=resolution,
                aspect_ratio=timeline.aspect_ratio,
                fps=timeline.fps,
                status="COMPLETED",
                storage_path=object_key,
                url=media_url,
                file_size_bytes=file_size,
            )
            db.add(final_video)
            db.commit()
            db.refresh(final_video)

            # 6. Complete RenderJob
            job.status = "COMPLETED"
            job.progress = 100
            job.output_video_id = final_video.id
            job.completed_at = datetime.utcnow()

            # 7. Update Campaign Status
            campaign = db.query(Campaign).filter(Campaign.id == job.campaign_id).first()
            if campaign:
                campaign.status = "completed"

            db.commit()
            return final_video

        except Exception as e:
            if "job" in locals() and job:
                job.status = "FAILED"
                job.error_message = str(e)
                db.commit()
            raise e

        finally:
            db.close()


render_worker = RenderWorker()
