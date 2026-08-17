from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.final_video import FinalVideo
from app.models.render_job import RenderJob
from app.models.timeline import Timeline


class RenderRepository:

    def create_timeline(
        self,
        db: Session,
        campaign_id: UUID,
        storyboard_id: UUID,
        duration: float,
        resolution: str,
        aspect_ratio: str,
        fps: int,
        tracks: Dict[str, Any],
    ) -> Timeline:
        timeline = Timeline(
            campaign_id=campaign_id,
            storyboard_id=storyboard_id,
            duration=duration,
            resolution=resolution,
            aspect_ratio=aspect_ratio,
            fps=fps,
            tracks=tracks,
        )
        db.add(timeline)
        db.commit()
        db.refresh(timeline)
        return timeline

    def create_render_job(
        self,
        db: Session,
        campaign_id: UUID,
        timeline_id: UUID,
    ) -> RenderJob:
        job = RenderJob(
            campaign_id=campaign_id,
            timeline_id=timeline_id,
            status="QUEUED",
            progress=0,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    def get_render_job_by_id(
        self,
        db: Session,
        job_id: UUID,
    ) -> Optional[RenderJob]:
        return db.query(RenderJob).filter(RenderJob.id == job_id).first()

    def get_final_videos_by_campaign(
        self,
        db: Session,
        campaign_id: UUID,
    ) -> List[FinalVideo]:
        return (
            db.query(FinalVideo)
            .filter(FinalVideo.campaign_id == campaign_id)
            .order_by(FinalVideo.version.asc())
            .all()
        )

    def get_final_video_by_id(
        self,
        db: Session,
        video_id: UUID,
    ) -> Optional[FinalVideo]:
        return db.query(FinalVideo).filter(FinalVideo.id == video_id).first()
