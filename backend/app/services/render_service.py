from typing import List
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.core.redis_client import redis_queue
from app.models.campaign import Campaign
from app.models.creative_bible import CreativeBible
from app.models.final_video import FinalVideo
from app.models.storyboard import Storyboard
from app.orchestration.timeline_builder import timeline_builder
from app.repositories.render_repository import RenderRepository
from app.schemas.final_video import FinalVideoResponse, PresignedUrlResponse
from app.schemas.render_job import RenderJobResponse, RenderRequest
from app.workers.render_worker import render_worker


class RenderService:

    def __init__(self):
        self.repository = RenderRepository()

    def dispatch_render_job(
        self,
        db: Session,
        storyboard_id: UUID,
        user_id: UUID,
        request: RenderRequest,
    ) -> RenderJobResponse:
        # 1. Validate Storyboard & Ownership via Campaign
        storyboard = (
            db.query(Storyboard)
            .options(
                joinedload(Storyboard.scenes),
                joinedload(Storyboard.creative_bible),
            )
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Storyboard.id == storyboard_id, Campaign.user_id == user_id)
            .first()
        )
        if storyboard is None:
            raise ValueError("Storyboard not found or unauthorized")

        campaign = db.query(Campaign).filter(Campaign.id == storyboard.campaign_id).first()

        # 2. Build Timeline Specification
        timeline_dict = timeline_builder.build_timeline(
            campaign=campaign,
            storyboard=storyboard,
            scenes=storyboard.scenes,
            creative_bible=storyboard.creative_bible,
            resolution=request.resolution,
            aspect_ratio=request.aspect_ratio,
            fps=request.fps,
        )

        # 3. Create Timeline in PostgreSQL
        timeline = self.repository.create_timeline(
            db=db,
            campaign_id=campaign.id,
            storyboard_id=storyboard.id,
            duration=timeline_dict["duration"],
            resolution=timeline_dict["resolution"],
            aspect_ratio=timeline_dict["aspect_ratio"],
            fps=timeline_dict["fps"],
            tracks=timeline_dict["tracks"],
        )

        # 4. Create RenderJob
        job = self.repository.create_render_job(
            db=db,
            campaign_id=campaign.id,
            timeline_id=timeline.id,
        )

        # 5. Push to Redis Task Queue
        redis_queue.enqueue_job({
            "render_job_id": str(job.id),
            "campaign_id": str(campaign.id),
            "timeline_id": str(timeline.id),
        })

        # 6. Execute Render Worker
        render_worker.process_render_job_sync(job.id)

        # 7. Reload RenderJob with updated state
        db.expire_all()
        completed_job = self.repository.get_render_job_by_id(db=db, job_id=job.id)

        return RenderJobResponse.model_validate(completed_job)

    def get_render_job_status(
        self,
        db: Session,
        render_job_id: UUID,
        user_id: UUID,
    ) -> RenderJobResponse:
        job = (
            db.query(self.repository.get_render_job_by_id(db=db, job_id=render_job_id))
            if hasattr(self.repository, "x")
            else self.repository.get_render_job_by_id(db=db, job_id=render_job_id)
        )
        if job is None:
            raise ValueError("Render job not found")

        # Validate campaign ownership
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == job.campaign_id, Campaign.user_id == user_id)
            .first()
        )
        if campaign is None:
            raise ValueError("Unauthorized to access this render job")

        return RenderJobResponse.model_validate(job)

    def get_campaign_final_videos(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> List[FinalVideoResponse]:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id, Campaign.user_id == user_id)
            .first()
        )
        if campaign is None:
            raise ValueError("Campaign not found or unauthorized")

        videos = self.repository.get_final_videos_by_campaign(db=db, campaign_id=campaign_id)
        return [FinalVideoResponse.model_validate(v) for v in videos]

    def get_final_video_url(
        self,
        db: Session,
        final_video_id: UUID,
        user_id: UUID,
    ) -> PresignedUrlResponse:
        video = self.repository.get_final_video_by_id(db=db, video_id=final_video_id)
        if video is None:
            raise ValueError("Final video not found")

        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == video.campaign_id, Campaign.user_id == user_id)
            .first()
        )
        if campaign is None:
            raise ValueError("Unauthorized to access this final video")

        return PresignedUrlResponse(
            id=video.id,
            version=video.version,
            download_url=video.url,
            expires_in_seconds=3600,
        )
