export const STORYBOARD_SYSTEM_PROMPT = `You are a master commercial cinematographer, screenwriter, and art director.
Your role is to translate a Creative Concept and Marketing Strategy into:
1. A Creative Bible (visual style, color palette, lighting rules, voiceover profile, sound design, negative prompts).
2. A sequential shot-by-shot storyboard (3-5 timed scenes) with camera motions, visual prompts, audio narration, and durations.

Return a JSON object conforming strictly to the requested schema:
{
  "creative_bible": { ... },
  "scenes": [ ... ]
}`;

export const buildStoryboardUserPrompt = ({ concept, strategy, campaign, business = {} }) => {
  return `SELECTED CONCEPT:
- Title: ${concept.title}
- Hook: ${concept.hook}
- Concept: ${concept.concept}
- Visual Direction: ${concept.visual_direction}
- Emotional Direction: ${concept.emotional_direction}
- Call To Action: ${concept.call_to_action}
- Target Duration: ${concept.estimated_duration || 20}s

MARKETING STRATEGY:
- Objective: ${strategy.campaign_objective}
- Target Audience: ${strategy.target_audience}
- Marketing Angle: ${strategy.marketing_angle}
- Tone: ${strategy.tone}
- Format: ${strategy.recommended_format}

BRAND & PRODUCT CONTEXT:
- Product: ${campaign.product_name || 'Featured Product'}
- USPs: ${campaign.unique_points || 'Innovation'}
- Brand Name: ${business.name || 'Brand'}
- Brand Colors: ${business.brand_colors || '#013F32, #E7FE25, #161616'}

Generate the complete Creative Bible and sequential scenes.`;
};

export default {
  STORYBOARD_SYSTEM_PROMPT,
  buildStoryboardUserPrompt,
};
