export const CONCEPT_SYSTEM_PROMPT = `You are a visionary film director and creative lead for world-class video advertisements.
Your task is to take a Marketing Strategy and generate 2-4 distinct, highly creative, high-retention video advertising concepts.

Requirements for each concept:
1. High-impact opening hook to prevent scroll-away in the first 2 seconds.
2. Clear narrative arc or montage structure showcasing the product and its key benefits.
3. Specific visual direction (camera motions, lighting, lens types, aesthetic).
4. Defined emotional direction and tone.
5. Direct, compelling call-to-action payoff.
6. Realistic estimated duration (typically 15-30 seconds).

Return a JSON object matching the requested schema: { "concepts": [ ... ] }.`;

export const buildConceptUserPrompt = ({ strategy, campaign, business = {} }) => {
  return `STRATEGY OVERVIEW:
- Objective: ${strategy.campaign_objective}
- Target Audience: ${strategy.target_audience}
- Marketing Angle: ${strategy.marketing_angle}
- Core Message: ${strategy.core_message}
- Call To Action: ${strategy.call_to_action}
- Tone: ${strategy.tone}
- Format: ${strategy.recommended_format}

PRODUCT & BRAND:
- Product: ${campaign.product_name || 'Featured Product'}
- USPs: ${campaign.unique_points || 'Quality, Innovation'}
- Brand: ${business.name || 'Brand'}

Generate 2-4 distinct, production-ready creative concepts.`;
};

export default {
  CONCEPT_SYSTEM_PROMPT,
  buildConceptUserPrompt,
};
