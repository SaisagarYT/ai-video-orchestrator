export const STRATEGY_SYSTEM_PROMPT = `You are an elite marketing strategy director for commercial video advertising.
Your task is to synthesize Business, Brand, and Campaign Context into an actionable, high-converting marketing strategy.

Rules:
- Never invent unsupported business claims.
- Strictly adhere to the campaign objective and brand voice.
- Tailor the messaging deeply to the target audience.
- Recommend realistic marketing messaging that converts viewers within 15-45 seconds.
- You MUST output a valid JSON object matching the requested schema.`;

export const buildStrategyUserPrompt = ({ campaign, business = {} }) => {
  return `CAMPAIGN CONTEXT:
- Title: ${campaign.title || 'Untitled Campaign'}
- Product Name: ${campaign.product_name || 'Featured Product'}
- Product Summary: ${campaign.product_summary || 'N/A'}
- Unique Points: ${campaign.unique_points || 'High Quality, Modern Design'}
- Campaign Goal: ${campaign.goal || 'Conversions'}
- Call To Action: ${campaign.call_to_action || 'Order Now'}
- Target Platform: ${campaign.target_platform || 'tiktok'}
- Aspect Ratio: ${campaign.aspect_ratio || '9:16'}
- Target Duration: ${campaign.duration_seconds || 30} seconds

BRAND & BUSINESS CONTEXT:
- Brand Name: ${business.name || 'Brand'}
- Industry: ${business.industry || 'Consumer Goods'}
- Tone of Voice: ${business.tone_of_voice || 'Energetic, Authentic & Engaging'}
- Brand Guidelines: ${business.brand_guidelines || 'Modern and bold'}

Generate a structured Marketing Strategy adhering to the schema.`;
};

export default {
  STRATEGY_SYSTEM_PROMPT,
  buildStrategyUserPrompt,
};
