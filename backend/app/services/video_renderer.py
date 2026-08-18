import io
import os
import subprocess
import tempfile
import urllib.parse
from typing import Any, Dict, List, Tuple
from PIL import Image, ImageDraw, ImageFont
import requests

from app.providers.audio.tts_provider import ElevenLabsAudioProvider
from app.providers.image.image_provider import FluxImageProvider


class VideoRenderer:
    """
    Production-Grade Visual Video Rendering Engine.
    Draws photorealistic visual scene cards, animates with cinematic Ken Burns camera motion,
    and synchronizes neural voiceover audio using FFmpeg into a 1080x1920 H.264 / AAC master commercial.
    """

    def __init__(self):
        self.image_provider = FluxImageProvider()
        self.audio_provider = ElevenLabsAudioProvider()

    def _draw_scene_card(
        self,
        brand_name: str,
        scene_title: str,
        prompt_text: str,
        narration_text: str,
        cta_text: str,
        seq_num: int,
        total_seq: int,
    ) -> str:
        width, height = 1080, 1920
        # 1. Fetch or generate photorealistic AI image for background
        bg_image_bytes, _ = self.image_provider.generate_image(
            prompt=f"{prompt_text}, high commercial product advertisement, 8k resolution, cinematic lighting",
            aspect_ratio="9:16",
            seed=seq_num * 101,
        )

        try:
            img = Image.open(io.BytesIO(bg_image_bytes)).convert("RGB")
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        except Exception:
            img = Image.new("RGB", (width, height), color="#10141e")

        draw = ImageDraw.Draw(img)

        # 2. Draw Top Cinematic Header Overlay
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)

        # Top dark gradient
        for y in range(300):
            alpha = int(220 * (1 - y / 300))
            overlay_draw.line([(0, y), (width, y)], fill=(10, 14, 25, alpha))

        # Bottom dark gradient for subtitle readability
        for y in range(1300, 1920):
            alpha = int(240 * ((y - 1300) / 620))
            overlay_draw.line([(0, y), (width, y)], fill=(10, 14, 25, alpha))

        img.paste(Image.alpha_composite(Image.new("RGBA", (width, height), (0, 0, 0, 0)), overlay).convert("RGB"), (0, 0), overlay)

        # Re-initialize draw on final blended image
        draw = ImageDraw.Draw(img)

        # Brand Header
        clean_brand = brand_name.upper() if brand_name else "PREMIUM BRAND"
        draw.text((width // 2, 90), f"★  {clean_brand}  ★", fill="#FFD700", anchor="mm")
        draw.text((width // 2, 140), "OFFICIAL COMMERCIAL PREVIEW", fill="#E2E8F0", anchor="mm")

        # Scene Sequence Badge
        draw.rectangle([(width // 2 - 220, 180), (width // 2 + 220, 230)], fill="#1E293B", outline="#06B6D4", width=2)
        draw.text((width // 2, 205), f"SCENE {seq_num} OF {total_seq} • {scene_title.upper()}", fill="#38BDF8", anchor="mm")

        # Voice-over Subtitle Box at Bottom
        draw.rectangle([(60, 1420), (width - 60, 1620)], fill="#0B0F19", outline="#3B82F6", width=3)
        draw.text((width // 2, 1460), "🎙️ AI NEURAL VOICEOVER", fill="#38BDF8", anchor="mm")

        clean_narration = narration_text if narration_text else "Discover extraordinary design and unmatched performance."
        # Wrap narration
        words = clean_narration.split()
        lines = []
        curr = []
        for w in words:
            curr.append(w)
            if len(" ".join(curr)) > 36:
                lines.append(" ".join(curr))
                curr = []
        if curr:
            lines.append(" ".join(curr))

        y_sub = 1510
        for line in lines[:2]:
            draw.text((width // 2, y_sub), f"\"{line}\"", fill="#FFFFFF", anchor="mm")
            y_sub += 40

        # Call To Action Button (Final Payoff)
        draw.rectangle([(120, 1680), (width - 120, 1800)], fill="#E7FE25")
        draw.text((width // 2, 1740), f"👉  {cta_text.upper()}  ⚡", fill="#000000", anchor="mm")

        temp_img = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        img.save(temp_img.name)
        return temp_img.name

    def render_timeline(
        self,
        timeline_data: Dict[str, Any],
    ) -> Tuple[bytes, float, int, str]:
        duration = max(1.0, float(timeline_data.get("duration", 20.0)))
        resolution = timeline_data.get("resolution", "1080x1920")
        tracks = timeline_data.get("tracks", {})
        video_items = tracks.get("video_track", {}).get("items", [])
        cta_text = tracks.get("overlay_track", {}).get("call_to_action", {}).get("text", "ORDER NOW")

        total_scenes = len(video_items) if video_items else 1
        rendered_clips = []
        temp_files_to_cleanup = []

        try:
            if video_items:
                for idx, item in enumerate(video_items, start=1):
                    clip_dur = max(2.5, float(item.get("duration", duration / total_scenes)))
                    prompt = item.get("asset_url", f"Scene {idx} Visual Shot")
                    narration = ""
                    # Match narration from voice track
                    for v in tracks.get("voice_track", {}).get("items", []):
                        if v.get("scene_id") == item.get("scene_id"):
                            narration = v.get("narration", "")
                            break

                    card_path = self._draw_scene_card(
                        brand_name="AI Video Studio",
                        scene_title=f"Shot {idx}",
                        prompt_text=narration if narration else prompt,
                        narration_text=narration,
                        cta_text=cta_text,
                        seq_num=idx,
                        total_seq=total_scenes,
                    )
                    temp_files_to_cleanup.append(card_path)

                    # Generate authentic neural voiceover audio for this scene
                    audio_bytes, _ = self.audio_provider.generate_audio(
                        narration_text=narration if narration else "Experience perfection.",
                        voice_profile="Professional",
                    )
                    audio_path = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
                    with open(audio_path, "wb") as f_aud:
                        f_aud.write(audio_bytes)
                    temp_files_to_cleanup.append(audio_path)

                    clip_out = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
                    temp_files_to_cleanup.append(clip_out)

                    # Animate with Ken Burns zoom & blend real neural voice audio
                    total_frames = int(clip_dur * 30)
                    cmd = [
                        "ffmpeg", "-y",
                        "-loop", "1", "-i", card_path,
                        "-i", audio_path,
                        "-vf", f"zoompan=z='min(zoom+0.0008,1.20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s={resolution}:fps=30",
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-pix_fmt", "yuv420p",
                        "-c:a", "aac",
                        "-t", str(clip_dur),
                        clip_out,
                    ]
                    subprocess.run(cmd, capture_output=True, check=True)
                    rendered_clips.append(clip_out)

            # Concatenate all scene clips into Master Commercial Video
            master_out = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
            temp_files_to_cleanup.append(master_out)

            if rendered_clips:
                concat_list_file = tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w")
                temp_files_to_cleanup.append(concat_list_file.name)
                for clip_path in rendered_clips:
                    concat_list_file.write(f"file '{clip_path}'\n")
                concat_list_file.flush()

                concat_cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat", "-safe", "0", "-i", concat_list_file.name,
                    "-c:v", "copy",
                    "-c:a", "copy",
                    master_out,
                ]
                subprocess.run(concat_cmd, capture_output=True, check=True)
            else:
                # Single fallback card
                single_card = self._draw_scene_card(
                    "AI Video Studio", "Commercial", "Master Commercial", "", cta_text, 1, 1
                )
                temp_files_to_cleanup.append(single_card)
                single_cmd = [
                    "ffmpeg", "-y",
                    "-loop", "1", "-i", single_card,
                    "-f", "lavfi", "-i", f"sine=f=440:r=44100:d={duration}",
                    "-vf", f"zoompan=z='min(zoom+0.0008,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(duration*30)}:s={resolution}:fps=30",
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-t", str(duration),
                    master_out,
                ]
                subprocess.run(single_cmd, capture_output=True, check=True)

            with open(master_out, "rb") as f:
                master_bytes = f.read()

            return master_bytes, duration, len(master_bytes), resolution

        finally:
            for p in temp_files_to_cleanup:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass


video_renderer = VideoRenderer()

