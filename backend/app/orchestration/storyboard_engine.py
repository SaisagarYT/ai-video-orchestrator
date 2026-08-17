from typing import Any, Dict, List, Tuple
from app.models.creative_concept import CreativeConcept
from app.schemas.creative_bible import CreativeBibleSchema
from app.schemas.scene import SceneCreate
from app.schemas.strategy import MarketingStrategy


class StoryboardEngine:
    """
    AI Storyboard & Creative Bible Engine that decomposes a selected Creative Concept
    into timed cinematic scenes and a unified brand style guide.
    """

    def generate_storyboard(
        self,
        concept: CreativeConcept,
        strategy: MarketingStrategy,
        business_context: Dict[str, Any],
        campaign_context: Dict[str, Any],
        aspect_ratio: str = "9:16",
    ) -> Tuple[CreativeBibleSchema, List[SceneCreate]]:
        product = campaign_context.get("product_name") or "Featured Product"
        usps = campaign_context.get("unique_selling_points") or "premium craftsmanship"
        brand_name = business_context.get("name") or "Brand"
        brand_colors = business_context.get("brand_colors") or "#013F32, #E7FE25, #161616"
        tone = strategy.tone
        cta = strategy.call_to_action
        hook = concept.hook

        # 1. Synthesize Creative Bible
        creative_bible = CreativeBibleSchema(
            visual_style=(
                f"35mm Anamorphic Cinema aesthetic, ARRI Alexa 65 sensor grading, natural organic film grain, "
                f"shallow depth of field (f/1.8), {concept.visual_direction}."
            ),
            color_palette=(
                f"Curated Brand Palette: {brand_colors} with cinematic Kodak 5219 Vision3 color grade LUT, "
                f"high-dynamic contrast and rich tonal depth."
            ),
            lighting_rules=(
                "Sculpted directional key lighting, warm soft fill, high-contrast rim lighting outlining the product, "
                "subtle atmospheric volumetric haze."
            ),
            voiceover_profile=(
                f"Professional voice actor delivering with a {tone} demeanor, crisp diction, confident cadence, "
                f"and resonant emotional presence."
            ),
            music_sound_design=(
                "Rhythmic pulse synced to motion, transitioning from subtle ambient textures into a high-impact "
                "dynamic crescendo with hyper-detailed organic foley sound effects."
            ),
            negative_prompts=(
                "blurry, distorted textures, oversaturated plastic cartoon, deformed anatomy, text watermarks, "
                "low resolution artifacts, flickering, jump cuts, artificial CGI look."
            ),
        )

        # 2. Synthesize Sequential Scenes (3-5 Shots)
        total_duration = concept.estimated_duration or 20
        # Calculate proportional shot durations
        d1 = round(total_duration * 0.20, 1)  # ~3-4s
        d2 = round(total_duration * 0.25, 1)  # ~4-5s
        d3 = round(total_duration * 0.35, 1)  # ~6-8s
        d4 = round(total_duration - (d1 + d2 + d3), 1)  # ~3-4s

        scenes: List[SceneCreate] = [
            # Scene 1: The Opening Hook
            SceneCreate(
                sequence_number=1,
                shot_type="Dynamic Extreme Closeup (ECU)",
                camera_movement="High-Speed Dolly In with Slow-Motion Speed Ramp",
                visual_prompt=(
                    f"Cinematic {aspect_ratio} opening shot: Extreme close-up of {product}, capturing intricate surface details, "
                    f"subtle motion, dramatic rim lighting in {brand_colors.split(',')[0]} tones. Hyper-realistic, 8k broadcast commercial."
                ),
                audio_narration=hook,
                duration_seconds=d1,
                lighting_atmosphere="Volumetric dark obsidian backdrop with razor-sharp neon rim illumination.",
            ),
            # Scene 2: The Context & Tension
            SceneCreate(
                sequence_number=2,
                shot_type="Medium Wide Atmospheric Shot",
                camera_movement="Fluid Orbital Tracking Shot",
                visual_prompt=(
                    f"Cinematic {aspect_ratio} shot: Showing {strategy.target_audience} in their natural high-energy environment, "
                    f"anticipating the perfect experience. Natural atmospheric lighting, film grain, cinematic depth."
                ),
                audio_narration=f"When ordinary isn't enough, {product} delivers without compromise.",
                duration_seconds=d2,
                lighting_atmosphere="Warm golden-hour ambient illumination with natural diffusion.",
            ),
            # Scene 3: The Product Climax & Feature Demonstration
            SceneCreate(
                sequence_number=3,
                shot_type="Macro Hero Product Showcase",
                camera_movement="360° Circular Sweep with Smooth Tilt Up",
                visual_prompt=(
                    f"Cinematic {aspect_ratio} hero shot: Ultra-detailed macro reveal of {product}, demonstrating {usps}. "
                    f"Floating particle dynamics, pristine glass and metal reflections, studio commercial quality."
                ),
                audio_narration=f"Crafted with {usps}. Designed for those who demand excellence.",
                duration_seconds=d3,
                lighting_atmosphere="Dual-tone key and fill lighting emphasizing texture, sheen, and material craftsmanship.",
            ),
            # Scene 4: Call-To-Action & Payoff
            SceneCreate(
                sequence_number=4,
                shot_type="Center-Framed Brand Hero Lockup",
                camera_movement="Slow Majestic Pull-Back with Static Hold",
                visual_prompt=(
                    f"Cinematic {aspect_ratio} finale: {product} positioned center stage alongside elegant {brand_name} branding. "
                    f"Clean, authoritative commercial end card with soft glowing background bokeh."
                ),
                audio_narration=f"{cta}. Experience {product} today.",
                duration_seconds=d4,
                lighting_atmosphere="Clean, premium studio illumination with subtle ambient halo glow.",
            ),
        ]

        return creative_bible, scenes
