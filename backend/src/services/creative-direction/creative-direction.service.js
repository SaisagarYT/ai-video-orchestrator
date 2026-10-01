import { providerRegistry } from '../../providers/index.js';
import { storyboardPlanSchema } from './creative-direction.schema.js';
import { STORYBOARD_SYSTEM_PROMPT, buildStoryboardUserPrompt } from './creative-direction.prompts.js';
import { logger } from '../../core/logger/logger.js';

export class CreativeDirectionService {
  constructor(options = {}) {
    this.providerName = options.providerName;
  }

  async generateStoryboardPlan({
    concept,
    strategy,
    campaign,
    business = {},
    memoryContext = null,
    aspectRatio = '9:16',
  }) {
    const llm = providerRegistry.getLLM(this.providerName);
    const userPrompt = buildStoryboardUserPrompt({ concept, strategy, campaign, business });

    try {
      const response = await llm.generateStructured(
        {
          messages: [
            { role: 'system', content: STORYBOARD_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        },
        storyboardPlanSchema
      );

      const creativeBible = { ...response.parsed.creative_bible };
      if (memoryContext) {
        const brandColors = memoryContext.identity?.brandColors || business?.brand_colors;
        if (brandColors && !creativeBible.color_palette?.includes(brandColors)) {
          creativeBible.color_palette = `Brand Colors: ${brandColors}. ${creativeBible.color_palette || ''}`.trim();
        }
        const negativeConstraints = memoryContext.negativeConstraints || [];
        if (negativeConstraints.length > 0) {
          const extraNegatives = negativeConstraints
            .map((nc) => (typeof nc.value === 'string' ? nc.value : JSON.stringify(nc.value)))
            .join(', ');
          if (!creativeBible.negative_prompts?.includes(extraNegatives)) {
            creativeBible.negative_prompts = `${creativeBible.negative_prompts || ''}, ${extraNegatives}`.trim();
          }
        }
        if (memoryContext.identity?.visualStyle && !creativeBible.visual_style?.includes(memoryContext.identity.visualStyle)) {
          creativeBible.visual_style = `${memoryContext.identity.visualStyle}. ${creativeBible.visual_style || ''}`.trim();
        }
      }

      return {
        creativeBible,
        scenes: response.parsed.scenes,
        usage: response.usage,
        latencyMs: response.latencyMs,
        provider: llm.name,
      };
    } catch (err) {
      logger.warn(`LLM storyboard plan generation failed (${err.message}), falling back to deterministic synthesis`, {
        error: err.message,
      });

      const fallback = this._synthesizeDeterministicStoryboard({
        concept,
        strategy,
        campaign,
        business,
        aspectRatio,
      });
      const validated = storyboardPlanSchema.parse(fallback);

      return {
        creativeBible: validated.creative_bible,
        scenes: validated.scenes,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs: 1,
        provider: 'deterministic-fallback',
      };
    }
  }

  _synthesizeDeterministicStoryboard({ concept, strategy, campaign, business = {}, aspectRatio = '9:16' }) {
    const product = campaign.product_name || 'Featured Product';
    const usps = campaign.unique_points || 'premium craftsmanship';
    const brandName = business.name || 'Brand';
    const brandColors = business.brand_colors || '#013F32, #E7FE25, #161616';
    const tone = strategy.tone || 'Energetic and dynamic';
    const cta = strategy.call_to_action || 'Order now';
    const hook = concept.hook || `Discover ${product}.`;
    const targetAudience = strategy.target_audience || 'Modern consumers';

    const creativeBible = {
      visual_style: `35mm Anamorphic Cinema aesthetic, ARRI Alexa 65 sensor grading, natural organic film grain, shallow depth of field (f/1.8), ${concept.visual_direction || 'modern high-energy visuals'}.`,
      color_palette: `Curated Brand Palette: ${brandColors} with cinematic Kodak 5219 Vision3 color grade LUT, high-dynamic contrast and rich tonal depth.`,
      lighting_rules: 'Sculpted directional key lighting, warm soft fill, high-contrast rim lighting outlining the product, subtle atmospheric volumetric haze.',
      voiceover_profile: `Professional voice actor delivering with a ${tone} demeanor, crisp diction, confident cadence, and resonant emotional presence.`,
      music_sound_design: 'Rhythmic pulse synced to motion, transitioning from subtle ambient textures into a high-impact dynamic crescendo with hyper-detailed organic foley sound effects.',
      negative_prompts: 'blurry, distorted textures, oversaturated plastic cartoon, deformed anatomy, text watermarks, low resolution artifacts, flickering, jump cuts, artificial CGI look.',
    };

    const totalDuration = concept.estimated_duration || 20;
    const d1 = Math.round(totalDuration * 0.2);
    const d2 = Math.round(totalDuration * 0.25);
    const d3 = Math.round(totalDuration * 0.35);
    const d4 = Math.max(1, totalDuration - (d1 + d2 + d3));

    const scenes = [
      {
        sequence_number: 1,
        shot_type: 'Dynamic Extreme Closeup (ECU)',
        camera_movement: 'High-Speed Dolly In with Slow-Motion Speed Ramp',
        visual_prompt: `Cinematic ${aspectRatio} opening shot: Extreme close-up of ${product}, capturing intricate surface details, subtle motion, dramatic rim lighting in ${brandColors.split(',')[0]} tones. Hyper-realistic, 8k broadcast commercial.`,
        audio_narration: hook,
        duration_seconds: d1,
        lighting_atmosphere: 'Volumetric dark obsidian backdrop with razor-sharp neon rim illumination.',
      },
      {
        sequence_number: 2,
        shot_type: 'Medium Wide Atmospheric Shot',
        camera_movement: 'Fluid Orbital Tracking Shot',
        visual_prompt: `Cinematic ${aspectRatio} shot: Showing ${targetAudience} in their natural high-energy environment, anticipating the perfect experience. Natural atmospheric lighting, film grain, cinematic depth.`,
        audio_narration: `When ordinary isn't enough, ${product} delivers without compromise.`,
        duration_seconds: d2,
        lighting_atmosphere: 'Warm golden-hour ambient illumination with natural diffusion.',
      },
      {
        sequence_number: 3,
        shot_type: 'Macro Hero Product Showcase',
        camera_movement: '360° Circular Sweep with Smooth Tilt Up',
        visual_prompt: `Cinematic ${aspectRatio} hero shot: Ultra-detailed macro reveal of ${product}, demonstrating ${usps}. Floating particle dynamics, pristine glass and metal reflections, studio commercial quality.`,
        audio_narration: `Crafted with ${usps}. Designed for those who demand excellence.`,
        duration_seconds: d3,
        lighting_atmosphere: 'Dual-tone key and fill lighting emphasizing texture, sheen, and material craftsmanship.',
      },
      {
        sequence_number: 4,
        shot_type: 'Center-Framed Brand Hero Lockup',
        camera_movement: 'Slow Majestic Pull-Back with Static Hold',
        visual_prompt: `Cinematic ${aspectRatio} finale: ${product} positioned center stage alongside elegant ${brandName} branding. Clean, authoritative commercial end card with soft glowing background bokeh.`,
        audio_narration: `${cta}. Experience ${product} today.`,
        duration_seconds: d4,
        lighting_atmosphere: 'Clean, premium studio illumination with subtle ambient halo glow.',
      },
    ];

    return {
      creative_bible: creativeBible,
      scenes,
    };
  }
}

export const creativeDirectionService = new CreativeDirectionService();
export default creativeDirectionService;
