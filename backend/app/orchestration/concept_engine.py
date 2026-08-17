from typing import Any, Dict, List
from app.schemas.concept import CreativeConcept
from app.schemas.strategy import MarketingStrategy


class CreativeConceptEngine:
    """
    Creative Concept Engine that transforms a Marketing Strategy into 3-4 distinct,
    production-ready video creative directions.
    """

    def generate_concepts(
        self,
        strategy: MarketingStrategy,
        business_context: Dict[str, Any],
        campaign_context: Dict[str, Any],
    ) -> List[CreativeConcept]:
        product = campaign_context.get("product_name") or "Product"
        cta = strategy.call_to_action
        tone = strategy.tone
        usps = campaign_context.get("unique_selling_points") or "premium quality and design"

        concepts = [
            # Concept 1: High-Retention Action Hook (Dynamic & Fast-Paced)
            CreativeConcept(
                title=f"The {product} Rush",
                hook=f"Ready to elevate your daily routine? Meet {product}.",
                concept=f"A fast-paced, rhythm-synced visual montage opening on dynamic motion, showcasing {product}'s core strength ({usps}), leading straight into a bold product hero reveal.",
                visual_direction="Fast whip pans, dynamic speed ramps, high-contrast studio lighting with volumetric backlights, and quick 1.5-2.5s cuts.",
                emotional_direction=f"High excitement, empowering, and modern ({tone}).",
                call_to_action=cta,
                estimated_duration=15,
            ),
            # Concept 2: Relatable Problem-Solution Narrative (Story-Driven)
            CreativeConcept(
                title=f"The Everyday Difference",
                hook=f"Tired of settling for ordinary? Here's why {product} changes everything.",
                concept=f"Opens on a relatable friction point for {strategy.target_audience}, followed by the seamless entrance of {product} solving the problem with effortless elegance.",
                visual_direction="Warm cinematic natural lighting, fluid tracking dolly shots, medium close-ups on authentic user reactions, transitioning to crisp product beauty shots.",
                emotional_direction="Relatable, reassuring, and deeply satisfying.",
                call_to_action=cta,
                estimated_duration=25,
            ),
            # Concept 3: Sensory Cinema / Macro Detail Showcase (Luxury & Craftsmanship)
            CreativeConcept(
                title=f"Precision & Craft",
                hook=f"One look. That's all it takes to see the difference.",
                concept=f"An ultra-high-definition visual exploration focusing on textures, material craftsmanship, tactile sound design, and micro-details that make {product} stand out.",
                visual_direction="Extreme macro 100mm lens photography, 60fps slow-motion fluid dynamics, soft rim lighting against dark textured obsidian backdrops.",
                emotional_direction="Premium, sophisticated, aspirational, and mesmerizing.",
                call_to_action=cta,
                estimated_duration=20,
            ),
            # Concept 4: Direct Response / Social Proof Hook
            CreativeConcept(
                title=f"Why Everyone Is Talking About {product}",
                hook=f"Stop scrolling: this is the {product} everyone is raving about.",
                concept=f"High-energy creator-style presentation highlighting 3 distinct reasons ({usps}) why {strategy.target_audience} chooses {product}, ending with urgency.",
                visual_direction="Front-facing dynamic framing, on-screen kinetic typography badges, seamless split-screen feature callouts, vibrant saturated color grading.",
                emotional_direction="Curious, trendy, persuasive, and urgent.",
                call_to_action=cta,
                estimated_duration=30,
            ),
        ]

        return concepts
