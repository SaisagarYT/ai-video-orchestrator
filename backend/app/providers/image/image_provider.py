import io
import urllib.parse
from typing import Tuple
from PIL import Image, ImageDraw
import requests

from app.core.config import settings
from app.providers.base import BaseImageProvider


class FluxImageProvider(BaseImageProvider):
    """
    Flux / Diffusion Image AI provider for generating photorealistic keyframe stills.
    Integrates live zero-cost FLUX.1 generation via Pollinations & Hugging Face.
    """

    def __init__(self):
        self.hf_token = settings.HUGGINGFACE_API_KEY

    def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "9:16",
        seed: int = 42,
        **kwargs,
    ) -> Tuple[bytes, str]:
        # Determine pixel resolution according to aspect ratio
        if aspect_ratio == "9:16":
            width, height = 768, 1344
        elif aspect_ratio == "16:9":
            width, height = 1344, 768
        else:
            width, height = 1024, 1024

        clean_prompt = prompt.replace("\n", " ").strip()
        if not clean_prompt:
            clean_prompt = "Cinematic product showcase commercial photography, 8k resolution, photorealistic, dramatic studio lighting"

        # 1. Try Live Pollinations FLUX.1 Generation (100% Free, Photorealistic)
        try:
            encoded_prompt = urllib.parse.quote(clean_prompt[:250])
            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width={width}&height={height}&model=flux&seed={seed}&nologo=true&enhance=true"
            )
            response = requests.get(pollinations_url, timeout=30)
            if response.status_code == 200 and len(response.content) > 5000:
                return response.content, "image/jpeg"
        except Exception as e:
            print(f"[Pollinations Flux Warning] {e}")

        # 2. Try Hugging Face Serverless FLUX.1-schnell if HF Token provided
        if self.hf_token:
            try:
                hf_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
                headers = {"Authorization": f"Bearer {self.hf_token}"}
                payload = {"inputs": clean_prompt[:200]}
                hf_res = requests.post(hf_url, headers=headers, json=payload, timeout=30)
                if hf_res.status_code == 200 and len(hf_res.content) > 5000:
                    return hf_res.content, "image/jpeg"
            except Exception as e:
                print(f"[HuggingFace Flux Warning] {e}")

        # 3. High Quality Visual Canvas Fallback
        img = Image.new("RGB", (width, height), color="#0e1118")
        draw = ImageDraw.Draw(img)
        draw.rectangle([(40, 40), (width - 40, height - 40)], outline="#FFD700", width=4)
        draw.text((width // 2, height // 2), f"AI KEYFRAME PREVIEW\n{clean_prompt[:60]}...", fill="#FFFFFF", anchor="mm")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue(), "image/png"

