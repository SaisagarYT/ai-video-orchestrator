from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.master_video import MasterVideo


class MasterVideoRepository:

    def save_master_video(
        self,
        db: Session,
        user_id: UUID,
        campaign_id: UUID,
        storyboard_id: UUID,
        title: str,
        aspect_ratio: str,
        resolution: str,
        duration_seconds: float,
        storage_path: str,
        url: str,
        file_size_bytes: int,
    ) -> MasterVideo:
        existing = (
            db.query(MasterVideo)
            .filter(MasterVideo.storyboard_id == storyboard_id)
            .first()
        )

        if existing:
            existing.title = title
            existing.aspect_ratio = aspect_ratio
            existing.resolution = resolution
            existing.duration_seconds = duration_seconds
            existing.status = "completed"
            existing.storage_path = storage_path
            existing.url = url
            existing.file_size_bytes = file_size_bytes
            existing.completed_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

        master = MasterVideo(
            user_id=user_id,
            campaign_id=campaign_id,
            storyboard_id=storyboard_id,
            title=title,
            aspect_ratio=aspect_ratio,
            resolution=resolution,
            duration_seconds=duration_seconds,
            status="completed",
            storage_path=storage_path,
            url=url,
            file_size_bytes=file_size_bytes,
            completed_at=datetime.utcnow(),
        )
        db.add(master)
        db.commit()
        db.refresh(master)
        return master

    def get_by_storyboard(
        self,
        db: Session,
        storyboard_id: UUID,
        user_id: UUID | None = None,
    ) -> Optional[MasterVideo]:
        query = db.query(MasterVideo).filter(MasterVideo.storyboard_id == storyboard_id)
        if user_id is not None:
            query = query.filter(MasterVideo.user_id == user_id)
        return query.first()

    def get_by_id(
        self,
        db: Session,
        master_id: UUID,
        user_id: UUID | None = None,
    ) -> Optional[MasterVideo]:
        query = db.query(MasterVideo).filter(MasterVideo.id == master_id)
        if user_id is not None:
            query = query.filter(MasterVideo.user_id == user_id)
        return query.first()
