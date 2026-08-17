from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.core.storage import storage_client
from app.models.campaign import Campaign
from app.models.storyboard import Storyboard
from app.orchestration.timeline_engine import timeline_engine
from app.repositories.master_video_repository import MasterVideoRepository
from app.schemas.master_video import MasterVideoRenderRequest, MasterVideoResponse


class TimelineService:

    def __init__(self):
        self.repository = MasterVideoRepository()

    def render_master_commercial(
        self,
        db: Session,
        storyboard_id: UUID,
        user_id: UUID,
        request: MasterVideoRenderRequest,
    ) -> MasterVideoResponse:
        # 1. Validate Storyboard & Ownership via Campaign
        storyboard = (
            db.query(Storyboard)
            .options(joinedload(Storyboard.scenes))
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Storyboard.id == storyboard_id, Campaign.user_id == user_id)
            .first()
        )
        if storyboard is None:
            raise ValueError("Storyboard not found or unauthorized")

        scenes = sorted(storyboard.scenes, key=lambda s: s.sequence_number)
        if not scenes:
            raise ValueError("Storyboard contains no scenes to render")

        # 2. Execute Timeline Stitching
        master_bytes, duration, mime_type = timeline_engine.stitch_master_timeline(
            storyboard=storyboard,
            scenes=scenes,
            resolution=request.resolution,
            transition_type=request.transition_type,
        )

        # 3. Upload Master Commercial to MinIO
        object_key = f"campaigns/{storyboard.campaign_id}/master_commercial_{request.resolution}.mp4"
        media_url = storage_client.upload_bytes(
            object_name=object_key,
            data=master_bytes,
            content_type=mime_type,
        )

        # 4. Save MasterVideo Record
        master_video = self.repository.save_master_video(
            db=db,
            user_id=user_id,
            campaign_id=storyboard.campaign_id,
            storyboard_id=storyboard.id,
            title=f"Master Commercial: {storyboard.title}",
            aspect_ratio=storyboard.aspect_ratio,
            resolution=request.resolution,
            duration_seconds=duration,
            storage_path=object_key,
            url=media_url,
            file_size_bytes=len(master_bytes),
        )

        # 5. Update Campaign & Storyboard Status
        campaign = db.query(Campaign).filter(Campaign.id == storyboard.campaign_id).first()
        if campaign:
            campaign.status = "completed"
        storyboard.status = "completed"
        db.commit()

        return MasterVideoResponse.model_validate(master_video)

    def get_master_commercial(
        self,
        db: Session,
        storyboard_id: UUID,
        user_id: UUID,
    ) -> MasterVideoResponse:
        # Validate ownership
        storyboard = (
            db.query(Storyboard)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Storyboard.id == storyboard_id, Campaign.user_id == user_id)
            .first()
        )
        if storyboard is None:
            raise ValueError("Storyboard not found or unauthorized")

        master_video = self.repository.get_by_storyboard(
            db=db,
            storyboard_id=storyboard_id,
            user_id=user_id,
        )
        if master_video is None:
            raise ValueError("Master video has not been rendered yet for this storyboard")

        return MasterVideoResponse.model_validate(master_video)
