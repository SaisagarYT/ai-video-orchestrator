from typing import List, Optional
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.asset import Asset
from app.models.business import Business
from app.models.campaign import Campaign
from app.models.creative_bible import CreativeBible
from app.models.creative_concept import CreativeConcept
from app.models.final_video import FinalVideo
from app.models.scene import Scene
from app.models.storyboard import Storyboard
from app.schemas.asset import AssetResponse
from app.schemas.business import BusinessResponse
from app.schemas.campaign import CampaignResponse
from app.schemas.concept import CreativeConceptResponse
from app.schemas.dashboard import DashboardOverviewResponse, RecentCampaignSummary
from app.schemas.final_video import FinalVideoResponse
from app.schemas.storyboard import StoryboardResponse
from app.schemas.strategy import CampaignStrategyResponse
from app.schemas.workspace import (
    CampaignProgressResponse,
    CampaignWorkspaceResponse,
    SceneCreateRequest,
    SceneDetailResponse,
    SceneReorderRequest,
)


class WorkspaceService:

    def get_campaign_workspace(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> CampaignWorkspaceResponse:
        campaign = (
            db.query(Campaign)
            .options(
                joinedload(Campaign.business),
                joinedload(Campaign.strategy),
                joinedload(Campaign.creative_concepts),
                joinedload(Campaign.final_videos),
            )
            .filter(Campaign.id == campaign_id, Campaign.user_id == user_id)
            .first()
        )
        if campaign is None:
            raise ValueError("Campaign not found")

        # Load Storyboard and Scene Hierarchy
        storyboard = (
            db.query(Storyboard)
            .options(
                joinedload(Storyboard.creative_bible),
                joinedload(Storyboard.scenes).joinedload(Scene.assets),
            )
            .filter(Storyboard.campaign_id == campaign_id)
            .first()
        )

        # Build Scene Detail Items
        scene_details: List[SceneDetailResponse] = []
        if storyboard and storyboard.scenes:
            sorted_scenes = sorted(storyboard.scenes, key=lambda s: s.sequence_number)
            for s in sorted_scenes:
                assets = [AssetResponse.model_validate(a) for a in sorted(s.assets, key=lambda a: a.version)]
                selected_asset = next((a for a in assets if a.is_selected), None)
                if selected_asset is None and assets:
                    selected_asset = assets[0]

                detail = SceneDetailResponse(
                    id=s.id,
                    storyboard_id=s.storyboard_id,
                    sequence_number=s.sequence_number,
                    shot_type=s.shot_type,
                    camera_movement=s.camera_movement,
                    visual_prompt=s.visual_prompt,
                    audio_narration=s.audio_narration,
                    duration_seconds=s.duration_seconds,
                    lighting_atmosphere=s.lighting_atmosphere,
                    status=s.status,
                    video_asset_url=s.video_asset_url,
                    audio_asset_url=s.audio_asset_url,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                    assets=assets,
                    selected_asset=selected_asset,
                )
                scene_details.append(detail)

        # Calculate Progress
        progress = self._compute_progress(campaign=campaign, storyboard=storyboard, scenes=scene_details)

        # Selected concept
        selected_concept = None
        for c in campaign.creative_concepts:
            if c.is_selected:
                selected_concept = CreativeConceptResponse.model_validate(c)
                break

        return CampaignWorkspaceResponse(
            campaign=CampaignResponse.model_validate(campaign),
            business=BusinessResponse.model_validate(campaign.business) if campaign.business else None,
            strategy=CampaignStrategyResponse.model_validate(campaign.strategy) if campaign.strategy else None,
            concepts=[CreativeConceptResponse.model_validate(c) for c in campaign.creative_concepts],
            selected_concept=selected_concept,
            storyboard=StoryboardResponse.model_validate(storyboard) if storyboard else None,
            scenes=scene_details,
            final_videos=[FinalVideoResponse.model_validate(v) for v in campaign.final_videos],
            progress=progress,
        )

    def get_campaign_progress(
        self,
        db: Session,
        campaign_id: UUID,
        user_id: UUID,
    ) -> CampaignProgressResponse:
        workspace = self.get_campaign_workspace(db=db, campaign_id=campaign_id, user_id=user_id)
        return workspace.progress

    def add_scene(
        self,
        db: Session,
        storyboard_id: UUID,
        user_id: UUID,
        request: SceneCreateRequest,
    ) -> SceneDetailResponse:
        storyboard = (
            db.query(Storyboard)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Storyboard.id == storyboard_id, Campaign.user_id == user_id)
            .first()
        )
        if storyboard is None:
            raise ValueError("Storyboard not found or unauthorized")

        scenes = (
            db.query(Scene)
            .filter(Scene.storyboard_id == storyboard_id)
            .order_by(Scene.sequence_number.asc())
            .all()
        )

        next_seq = (scenes[-1].sequence_number + 1) if scenes else 1
        target_seq = request.sequence_number if request.sequence_number is not None else next_seq

        # If inserting in between, shift subsequent sequence numbers
        for s in scenes:
            if s.sequence_number >= target_seq:
                s.sequence_number += 1

        new_scene = Scene(
            storyboard_id=storyboard_id,
            sequence_number=target_seq,
            shot_type=request.shot_type,
            camera_movement=request.camera_movement,
            visual_prompt=request.visual_prompt,
            audio_narration=request.audio_narration,
            duration_seconds=request.duration_seconds,
            lighting_atmosphere=request.lighting_atmosphere,
            status="pending",
        )
        db.add(new_scene)
        db.commit()
        db.refresh(new_scene)

        return SceneDetailResponse(
            id=new_scene.id,
            storyboard_id=new_scene.storyboard_id,
            sequence_number=new_scene.sequence_number,
            shot_type=new_scene.shot_type,
            camera_movement=new_scene.camera_movement,
            visual_prompt=new_scene.visual_prompt,
            audio_narration=new_scene.audio_narration,
            duration_seconds=new_scene.duration_seconds,
            lighting_atmosphere=new_scene.lighting_atmosphere,
            status=new_scene.status,
            video_asset_url=new_scene.video_asset_url,
            audio_asset_url=new_scene.audio_asset_url,
            created_at=new_scene.created_at,
            updated_at=new_scene.updated_at,
            assets=[],
            selected_asset=None,
        )

    def reorder_scenes(
        self,
        db: Session,
        storyboard_id: UUID,
        user_id: UUID,
        request: SceneReorderRequest,
    ) -> List[SceneDetailResponse]:
        storyboard = (
            db.query(Storyboard)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Storyboard.id == storyboard_id, Campaign.user_id == user_id)
            .first()
        )
        if storyboard is None:
            raise ValueError("Storyboard not found or unauthorized")

        scenes = db.query(Scene).filter(Scene.storyboard_id == storyboard_id).all()
        scene_map = {str(s.id): s for s in scenes}

        for idx, scene_id in enumerate(request.scene_ids_in_order, start=1):
            s_str = str(scene_id)
            if s_str in scene_map:
                scene_map[s_str].sequence_number = idx

        db.commit()

        # Reload updated workspace scenes
        updated_scenes = (
            db.query(Scene)
            .options(joinedload(Scene.assets))
            .filter(Scene.storyboard_id == storyboard_id)
            .order_by(Scene.sequence_number.asc())
            .all()
        )

        results = []
        for s in updated_scenes:
            assets = [AssetResponse.model_validate(a) for a in s.assets]
            selected = next((a for a in assets if a.is_selected), None)
            results.append(SceneDetailResponse(
                id=s.id,
                storyboard_id=s.storyboard_id,
                sequence_number=s.sequence_number,
                shot_type=s.shot_type,
                camera_movement=s.camera_movement,
                visual_prompt=s.visual_prompt,
                audio_narration=s.audio_narration,
                duration_seconds=s.duration_seconds,
                lighting_atmosphere=s.lighting_atmosphere,
                status=s.status,
                video_asset_url=s.video_asset_url,
                audio_asset_url=s.audio_asset_url,
                created_at=s.created_at,
                updated_at=s.updated_at,
                assets=assets,
                selected_asset=selected,
            ))
        return results

    def delete_scene(
        self,
        db: Session,
        storyboard_id: UUID,
        scene_id: UUID,
        user_id: UUID,
    ):
        storyboard = (
            db.query(Storyboard)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Storyboard.id == storyboard_id, Campaign.user_id == user_id)
            .first()
        )
        if storyboard is None:
            raise ValueError("Storyboard not found or unauthorized")

        scene = (
            db.query(Scene)
            .filter(Scene.id == scene_id, Scene.storyboard_id == storyboard_id)
            .first()
        )
        if scene is None:
            raise ValueError("Scene not found")

        db.delete(scene)
        db.commit()

        # Re-index remaining scenes 1, 2, 3...
        remaining_scenes = (
            db.query(Scene)
            .filter(Scene.storyboard_id == storyboard_id)
            .order_by(Scene.sequence_number.asc())
            .all()
        )
        for idx, s in enumerate(remaining_scenes, start=1):
            s.sequence_number = idx
        db.commit()

    def delete_asset(
        self,
        db: Session,
        scene_id: UUID,
        asset_id: UUID,
        user_id: UUID,
    ):
        scene = (
            db.query(Scene)
            .join(Storyboard, Scene.storyboard_id == Storyboard.id)
            .join(Campaign, Storyboard.campaign_id == Campaign.id)
            .filter(Scene.id == scene_id, Campaign.user_id == user_id)
            .first()
        )
        if scene is None:
            raise ValueError("Scene not found or unauthorized")

        asset = db.query(Asset).filter(Asset.id == asset_id, Asset.scene_id == scene_id).first()
        if asset is None:
            raise ValueError("Asset not found")

        was_selected = asset.is_selected
        db.delete(asset)
        db.commit()

        # If deleted asset was the selected one, select the next latest version
        if was_selected:
            remaining_assets = (
                db.query(Asset)
                .filter(Asset.scene_id == scene_id)
                .order_by(Asset.version.desc())
                .all()
            )
            if remaining_assets:
                remaining_assets[0].is_selected = True
                scene.video_asset_url = remaining_assets[0].url
            else:
                scene.video_asset_url = None
                scene.status = "pending"
            db.commit()

    def get_dashboard_overview(
        self,
        db: Session,
        user_id: UUID,
    ) -> DashboardOverviewResponse:
        total_campaigns = db.query(Campaign).filter(Campaign.user_id == user_id).count()

        total_videos = (
            db.query(FinalVideo)
            .join(Campaign, FinalVideo.campaign_id == Campaign.id)
            .filter(Campaign.user_id == user_id)
            .count()
        )

        total_scenes_gen = (
            db.query(Asset)
            .filter(Asset.user_id == user_id)
            .count()
        )

        recent_camps = (
            db.query(Campaign)
            .options(joinedload(Campaign.final_videos))
            .filter(Campaign.user_id == user_id)
            .order_by(Campaign.created_at.desc())
            .limit(5)
            .all()
        )

        recent_summaries = []
        for c in recent_camps:
            final_url = c.final_videos[-1].url if c.final_videos else None
            recent_summaries.append(RecentCampaignSummary(
                id=c.id,
                name=c.name,
                product_name=c.product_name,
                status=c.status,
                final_video_url=final_url,
                created_at=c.created_at,
            ))

        return DashboardOverviewResponse(
            total_campaigns=total_campaigns,
            total_rendered_videos=total_videos,
            total_scenes_generated=total_scenes_gen,
            recent_campaigns=recent_summaries,
        )

    def _compute_progress(
        self,
        campaign: Campaign,
        storyboard: Optional[Storyboard],
        scenes: List[SceneDetailResponse],
    ) -> CampaignProgressResponse:
        brief_completed = True
        strategy_completed = campaign.strategy is not None
        concept_selected = any(c.is_selected for c in campaign.creative_concepts)
        storyboard_ready = storyboard is not None
        
        scenes_total = len(scenes)
        scenes_with_assets = sum(1 for s in scenes if s.assets)
        scenes_generated = scenes_total > 0 and scenes_with_assets == scenes_total
        
        quality_evaluated = any(s.selected_asset is not None for s in scenes)
        final_rendered = len(campaign.final_videos) > 0

        # Determine Stage & Progress %
        if final_rendered:
            current_stage = "COMPLETED"
            progress_pct = 100
        elif scenes_generated:
            current_stage = "RENDER"
            progress_pct = 85
        elif storyboard_ready:
            current_stage = "GENERATION"
            progress_pct = 65
        elif concept_selected:
            current_stage = "STORYBOARD"
            progress_pct = 50
        elif strategy_completed:
            current_stage = "CONCEPTS"
            progress_pct = 35
        elif brief_completed:
            current_stage = "STRATEGY"
            progress_pct = 20
        else:
            current_stage = "BRIEF"
            progress_pct = 10

        return CampaignProgressResponse(
            brief_completed=brief_completed,
            strategy_completed=strategy_completed,
            concept_selected=concept_selected,
            storyboard_ready=storyboard_ready,
            scenes_generated=scenes_generated,
            scenes_generated_count=scenes_with_assets,
            scenes_total_count=scenes_total,
            quality_evaluated=quality_evaluated,
            final_rendered=final_rendered,
            current_stage=current_stage,
            progress_percentage=progress_pct,
        )
