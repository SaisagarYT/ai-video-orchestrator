from typing import Any, Dict, List, Optional
from app.models.campaign import Campaign
from app.models.creative_bible import CreativeBible
from app.models.scene import Scene
from app.models.storyboard import Storyboard


class TimelineBuilder:
    """
    Timeline Builder that converts Storyboard specifications and approved scene assets
    into an exact multi-track timeline ready for FFmpeg assembly.
    """

    def build_timeline(
        self,
        campaign: Campaign,
        storyboard: Storyboard,
        scenes: List[Scene],
        creative_bible: Optional[CreativeBible] = None,
        resolution: str = "1080x1920",
        aspect_ratio: str = "9:16",
        fps: int = 30,
    ) -> Dict[str, Any]:
        if not scenes:
            raise ValueError("Cannot construct timeline: Storyboard has no scenes")

        # 1. Sort scenes by sequence
        sorted_scenes = sorted(scenes, key=lambda s: s.sequence_number)

        video_items = []
        voice_items = []
        caption_items = []

        current_time = 0.0

        for scene in sorted_scenes:
            duration = scene.duration_seconds or 4.0
            start_time = round(current_time, 2)
            end_time = round(current_time + duration, 2)

            video_items.append({
                "scene_id": str(scene.id),
                "sequence_number": scene.sequence_number,
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "asset_url": scene.video_asset_url or f"mock_asset_scene_{scene.sequence_number}.mp4",
                "transition": "crossfade" if scene.sequence_number > 1 else "cut",
            })

            if scene.audio_narration:
                voice_items.append({
                    "scene_id": str(scene.id),
                    "start_time": start_time,
                    "end_time": end_time,
                    "narration": scene.audio_narration,
                    "asset_url": scene.audio_asset_url,
                })

                caption_items.append({
                    "start": round(start_time + 0.2, 2),
                    "end": round(end_time - 0.2, 2),
                    "text": scene.audio_narration,
                })

            current_time += duration

        total_duration = round(current_time, 2)

        # 2. Assemble Multi-Track Structure
        tracks = {
            "video_track": {
                "items": video_items,
            },
            "voice_track": {
                "items": voice_items,
            },
            "music_track": {
                "name": "Cinematic Atmospheric Score",
                "start_time": 0.0,
                "end_time": total_duration,
                "audio_ducking": {
                    "enabled": True,
                    "ducked_volume": 0.35,  # Reduce BGM to 35% when VO is active
                    "fade_duration": 0.3,
                },
            },
            "caption_track": {
                "items": caption_items,
                "style": {
                    "font": "Inter Bold",
                    "font_size": 42,
                    "primary_color": "#FFFFFF",
                    "outline_color": "#000000",
                    "position": "bottom_center",
                },
            },
            "overlay_track": {
                "logo": {
                    "position": "top_right",
                    "opacity": 0.9,
                    "start_time": 0.0,
                    "end_time": total_duration,
                },
                "call_to_action": {
                    "text": campaign.call_to_action,
                    "start_time": max(0.0, round(total_duration - 4.5, 2)),
                    "end_time": total_duration,
                    "position": "bottom_center",
                    "button_color": "#E7FE25",
                    "text_color": "#000000",
                },
            },
        }

        return {
            "duration": total_duration,
            "resolution": resolution,
            "aspect_ratio": aspect_ratio,
            "fps": fps,
            "tracks": tracks,
        }


timeline_builder = TimelineBuilder()
