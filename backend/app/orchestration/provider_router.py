from typing import Any, Dict, Tuple

from app.providers.audio.tts_provider import ElevenLabsAudioProvider
from app.providers.base import (
    BaseAudioProvider,
    BaseImageProvider,
    BaseTextProvider,
    BaseVideoProvider,
)
from app.providers.image.image_provider import FluxImageProvider
from app.providers.text.gemini_provider import GeminiTextProvider
from app.providers.text.openai_provider import OpenAITextProvider
from app.providers.video.higgsfield_provider import HiggsfieldVideoProvider


class ProviderRouter:
    """
    Unified Multi-Modal AI Provider Router.
    Routes generation requests to appropriate AI models (Video, Image, Audio, Text)
    with seamless fallback handling.
    """

    def __init__(self):
        # Text Providers
        self.text_providers: Dict[str, BaseTextProvider] = {
            "gemini": GeminiTextProvider(),
            "openai": OpenAITextProvider(),
            "default": GeminiTextProvider(),
        }

        # Video Providers
        self.video_providers: Dict[str, BaseVideoProvider] = {
            "higgsfield": HiggsfieldVideoProvider(),
            "default": HiggsfieldVideoProvider(),
        }

        # Image Providers
        self.image_providers: Dict[str, BaseImageProvider] = {
            "flux": FluxImageProvider(),
            "default": FluxImageProvider(),
        }

        # Audio Providers
        self.audio_providers: Dict[str, BaseAudioProvider] = {
            "elevenlabs": ElevenLabsAudioProvider(),
            "default": ElevenLabsAudioProvider(),
        }

    def generate_media_asset(
        self,
        job_type: str,
        prompt: str,
        aspect_ratio: str = "9:16",
        duration_seconds: float = 4.0,
        voice_profile: str = "Professional",
        requested_provider: str = "default",
        **kwargs,
    ) -> Tuple[bytes, str, str]:
        """
        Executes generation through the designated provider router.
        Returns: (media_bytes, mime_type, actual_provider_name)
        """
        provider_key = requested_provider.lower() if requested_provider else "default"

        if job_type in ["video_generation", "video"]:
            provider = self.video_providers.get(provider_key, self.video_providers["default"])
            bytes_data, mime_type = provider.generate_video(
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                duration_seconds=duration_seconds,
                **kwargs,
            )
            return bytes_data, mime_type, provider_key

        elif job_type in ["image_generation", "image"]:
            provider = self.image_providers.get(provider_key, self.image_providers["default"])
            bytes_data, mime_type = provider.generate_image(
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                **kwargs,
            )
            return bytes_data, mime_type, provider_key

        elif job_type in ["audio_narration", "audio"]:
            provider = self.audio_providers.get(provider_key, self.audio_providers["default"])
            bytes_data, mime_type = provider.generate_audio(
                narration_text=prompt,
                voice_profile=voice_profile,
                **kwargs,
            )
            return bytes_data, mime_type, provider_key

        else:
            # Fallback to video generation
            provider = self.video_providers["default"]
            bytes_data, mime_type = provider.generate_video(
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                duration_seconds=duration_seconds,
                **kwargs,
            )
            return bytes_data, mime_type, "default"


provider_router = ProviderRouter()
