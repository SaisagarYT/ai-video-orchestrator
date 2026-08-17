from abc import ABC, abstractmethod
from typing import Any, Dict, Tuple


class BaseTextProvider(ABC):

    @abstractmethod
    def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        **kwargs,
    ) -> str:
        pass

    @abstractmethod
    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> Dict[str, Any]:
        pass


class BaseImageProvider(ABC):

    @abstractmethod
    def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "9:16",
        **kwargs,
    ) -> Tuple[bytes, str]:
        """
        Returns a tuple of (image_bytes, mime_type).
        """
        pass


class BaseVideoProvider(ABC):

    @abstractmethod
    def generate_video(
        self,
        prompt: str,
        aspect_ratio: str = "9:16",
        duration_seconds: float = 4.0,
        **kwargs,
    ) -> Tuple[bytes, str]:
        """
        Returns a tuple of (video_bytes, mime_type).
        """
        pass


class BaseAudioProvider(ABC):

    @abstractmethod
    def generate_audio(
        self,
        narration_text: str,
        voice_profile: str = "Professional",
        **kwargs,
    ) -> Tuple[bytes, str]:
        """
        Returns a tuple of (audio_bytes, mime_type).
        """
        pass
