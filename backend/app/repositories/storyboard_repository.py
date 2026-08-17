from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.models.creative_bible import CreativeBible
from app.models.scene import Scene
from app.models.storyboard import Storyboard
from app.schemas.creative_bible import CreativeBibleSchema
from app.schemas.scene import SceneCreate, SceneUpdate


class StoryboardRepository:

    def save_storyboard(
        self,
        db: Session,
        campaign_id: UUID,
        concept_id: UUID,
        title: str,
        target_duration: int,
        aspect_ratio: str,
        creative_bible_data: CreativeBibleSchema,
        scenes_data: List[SceneCreate],
    ) -> Storyboard:
        # Check if a storyboard already exists for this campaign
        existing = (
            db.query(Storyboard)
            .filter(Storyboard.campaign_id == campaign_id)
            .first()
        )

        if existing:
            # Delete old storyboard and cascade its scenes and creative bible
            db.delete(existing)
            db.commit()

        # 1. Create Storyboard
        db_storyboard = Storyboard(
            campaign_id=campaign_id,
            concept_id=concept_id,
            title=title,
            aspect_ratio=aspect_ratio,
            target_duration=target_duration,
            status="ready_for_generation",
        )
        db.add(db_storyboard)
        db.commit()
        db.refresh(db_storyboard)

        # 2. Create Creative Bible
        db_bible = CreativeBible(
            storyboard_id=db_storyboard.id,
            visual_style=creative_bible_data.visual_style,
            color_palette=creative_bible_data.color_palette,
            lighting_rules=creative_bible_data.lighting_rules,
            voiceover_profile=creative_bible_data.voiceover_profile,
            music_sound_design=creative_bible_data.music_sound_design,
            negative_prompts=creative_bible_data.negative_prompts,
        )
        db.add(db_bible)

        # 3. Create Scenes
        for s in scenes_data:
            db_scene = Scene(
                storyboard_id=db_storyboard.id,
                sequence_number=s.sequence_number,
                shot_type=s.shot_type,
                camera_movement=s.camera_movement,
                visual_prompt=s.visual_prompt,
                audio_narration=s.audio_narration,
                duration_seconds=s.duration_seconds,
                lighting_atmosphere=s.lighting_atmosphere,
                status="pending",
            )
            db.add(db_scene)

        db.commit()
        db.refresh(db_storyboard)

        return db_storyboard

    def get_storyboard_by_campaign(
        self,
        db: Session,
        campaign_id: UUID,
    ) -> Optional[Storyboard]:
        return (
            db.query(Storyboard)
            .options(
                joinedload(Storyboard.scenes),
                joinedload(Storyboard.creative_bible),
            )
            .filter(Storyboard.campaign_id == campaign_id)
            .first()
        )

    def get_storyboard_by_id(
        self,
        db: Session,
        storyboard_id: UUID,
    ) -> Optional[Storyboard]:
        return (
            db.query(Storyboard)
            .options(
                joinedload(Storyboard.scenes),
                joinedload(Storyboard.creative_bible),
            )
            .filter(Storyboard.id == storyboard_id)
            .first()
        )

    def update_scene(
        self,
        db: Session,
        storyboard_id: UUID,
        scene_id: UUID,
        data: SceneUpdate,
    ) -> Scene:
        scene = (
            db.query(Scene)
            .filter(Scene.id == scene_id, Scene.storyboard_id == storyboard_id)
            .first()
        )

        if scene is None:
            raise ValueError("Scene not found in storyboard")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(scene, key, value)

        db.commit()
        db.refresh(scene)
        return scene
