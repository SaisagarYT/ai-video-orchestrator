from typing import Any, Dict
from app.schemas.strategy import MarketingStrategy


class StrategyEngine:
    """
    Marketing Strategy Engine that synthesizes Business, Brand, and Campaign Context
    into a structured creative marketing blueprint.
    """

    SYSTEM_PROMPT = """
You are KANGGIRD's marketing strategy engine.
Your task is to create a marketing strategy from:
1. Business information
2. Brand context
3. Campaign context

Rules:
- Never invent important business facts.
- Respect the campaign objective.
- Respect the brand voice.
- Prioritize the target audience.
- Recommend realistic marketing messaging.
- Do not make unsupported claims.
- Return structured JSON only.
"""

    def generate_strategy(
        self,
        business_context: Dict[str, Any],
        campaign_context: Dict[str, Any],
    ) -> MarketingStrategy:
        product_name = campaign_context.get("product_name") or "Featured Product"
        objective = campaign_context.get("objective") or "Drive Brand Awareness & Conversions"
        target_audience = (
            campaign_context.get("target_audience")
            or business_context.get("target_audience")
            or "Target Consumers & Prospective Clients"
        )
        tone = (
            campaign_context.get("tone")
            or business_context.get("tone_of_voice")
            or "Energetic, Authentic & Engaging"
        )
        cta = campaign_context.get("call_to_action") or "Order Now & Experience the Difference"
        platforms = campaign_context.get("target_platforms") or "Instagram Reels & TikTok"
        usps = campaign_context.get("unique_selling_points") or ""
        description = campaign_context.get("product_description") or ""

        # Marketing angle synthesis
        if usps:
            marketing_angle = f"Highlighting {product_name}'s breakthrough advantage: {usps}"
        else:
            marketing_angle = f"Positioning {product_name} as the premier choice for {target_audience}"

        # Core message synthesis
        core_message = (
            f"Discover {product_name} — crafted for {target_audience} to deliver outstanding performance."
        )

        # Platform and format recommendation
        if "9:16" in platforms or "Reels" in platforms or "TikTok" in platforms or "Shorts" in platforms:
            recommended_platform = "Instagram Reels & TikTok"
            recommended_format = "Short-form vertical video (9:16, 15-30s) with high-retention opening hook"
        else:
            recommended_platform = "Digital Broadcast & Multi-Platform"
            recommended_format = "Cinematic widescreen (16:9, 30-45s) with narrative pacing"

        return MarketingStrategy(
            campaign_objective=objective,
            target_audience=target_audience,
            marketing_angle=marketing_angle,
            core_message=core_message,
            call_to_action=cta,
            tone=tone,
            recommended_platform=recommended_platform,
            recommended_format=recommended_format,
        )
