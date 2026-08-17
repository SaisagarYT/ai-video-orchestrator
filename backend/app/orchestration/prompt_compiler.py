from typing import Optional
from app.models.creative_bible import CreativeBible
from app.models.scene import Scene
from app.schemas.generation_spec import GenerationSpecification


class PromptCompiler:
    """
    Compiler that ingests raw Scene parameters and Creative Bible rules
    to assemble an optimized, deterministic Generation Specification for AI Video models.
    """

    def compile_scene_specification(
        self,
        scene: Scene,
        creative_bible: Optional[CreativeBible] = None,
        target_provider: str = "higgsfield",
        aspect_ratio: str = "9:16",
        seed: int = 42,
    ) -> GenerationSpecification:
        style = (
            creative_bible.visual_style
            if creative_bible
            else "35mm anamorphic cinema look, shallow depth-of-field, organic film grain, 8k resolution"
        )
        colors = (
            creative_bible.color_palette
            if creative_bible
            else "High dynamic contrast, curated brand palette with Kodak 5219 LUT grading"
        )
        lighting = (
            f"{scene.lighting_atmosphere}. {creative_bible.lighting_rules}"
            if creative_bible
            else scene.lighting_atmosphere
        )
        negatives = (
            creative_bible.negative_prompts
            if creative_bible
            else "blurry, low quality, distorted textures, oversaturated plastic cartoon, deformed anatomy, text watermarks, flickering, artifacts"
        )

        compiled_positive_prompt = (
            f"{scene.visual_prompt}. "
            f"Camera Direction: {scene.shot_type} with {scene.camera_movement}. "
            f"Visual Style: {style}. "
            f"Lighting & Atmosphere: {lighting}. "
            f"Color Grading: {colors}. "
            f"Master commercial broadcast standard, photorealistic 8k render."
        )

        return GenerationSpecification(
            scene_id=scene.id,
            sequence_number=scene.sequence_number,
            compiled_positive_prompt=compiled_positive_prompt,
            compiled_negative_prompt=negatives,
            shot_type=scene.shot_type,
            camera_movement=scene.camera_movement,
            aspect_ratio=aspect_ratio,
            duration_seconds=scene.duration_seconds,
            visual_style=style,
            color_palette=colors,
            lighting_directives=lighting,
            target_provider=target_provider,
            fps=24,
            seed=seed,
        )


prompt_compiler = PromptCompiler()
