import { providerRegistry } from '../../providers/index.js';
import { conceptListSchema } from './concept.schema.js';
import { CONCEPT_SYSTEM_PROMPT, buildConceptUserPrompt } from './concept.prompts.js';
import { logger } from '../../core/logger/logger.js';

export class ConceptService {
  constructor(options = {}) {
    this.providerName = options.providerName;
  }

  async generateConcepts({ strategy, campaign, business = {} }) {
    const llm = providerRegistry.getLLM(this.providerName);
    const userPrompt = buildConceptUserPrompt({ strategy, campaign, business });

    try {
      const response = await llm.generateStructured(
        {
          messages: [
            { role: 'system', content: CONCEPT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        },
        conceptListSchema
      );

      return {
        concepts: response.parsed.concepts,
        usage: response.usage,
        latencyMs: response.latencyMs,
        provider: llm.name,
      };
    } catch (err) {
      logger.warn(`LLM concept generation failed (${err.message}), falling back to deterministic synthesis`, {
        error: err.message,
      });

      const fallback = this._synthesizeDeterministicConcepts({ strategy, campaign });
      const validated = conceptListSchema.parse({ concepts: fallback });

      return {
        concepts: validated.concepts,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs: 1,
        provider: 'deterministic-fallback',
      };
    }
  }

  _synthesizeDeterministicConcepts({ strategy, campaign }) {
    const product = campaign.product_name || 'Featured Product';
    const cta = strategy.call_to_action || campaign.call_to_action || 'Order Now';
    const tone = strategy.tone || 'Dynamic & Engaging';
    const usps = campaign.unique_points || 'premium quality and design';

    return [
      {
        title: `The ${product} Rush`,
        hook: `Ready to elevate your daily routine? Meet ${product}.`,
        concept: `A fast-paced, rhythm-synced visual montage opening on dynamic motion, showcasing ${product}'s core strength (${usps}), leading straight into a bold hero reveal.`,
        visual_direction: 'Fast whip pans, dynamic speed ramps, high-contrast studio lighting with volumetric backlights, and quick 1.5-2.5s cuts.',
        emotional_direction: `High excitement, empowering, and modern (${tone}).`,
        call_to_action: cta,
        estimated_duration: 15,
      },
      {
        title: 'The Everyday Difference',
        hook: `Tired of settling for ordinary? Here is why ${product} changes everything.`,
        concept: `Opens on a relatable friction point for ${strategy.target_audience}, followed by the seamless entrance of ${product} solving the problem with effortless elegance.`,
        visual_direction: 'Warm cinematic natural lighting, fluid tracking dolly shots, medium close-ups on authentic user reactions, transitioning to crisp product beauty shots.',
        emotional_direction: 'Relatable, reassuring, and deeply satisfying.',
        call_to_action: cta,
        estimated_duration: 25,
      },
      {
        title: 'Precision & Craft',
        hook: "One look. That's all it takes to see the difference.",
        concept: `An ultra-high-definition visual exploration focusing on textures, material craftsmanship, tactile sound design, and micro-details that make ${product} stand out.`,
        visual_direction: 'Extreme macro 100mm lens photography, 60fps slow-motion fluid dynamics, soft rim lighting against dark textured obsidian backdrops.',
        emotional_direction: 'Premium, sophisticated, aspirational, and mesmerizing.',
        call_to_action: cta,
        estimated_duration: 20,
      },
      {
        title: `Why Everyone Is Talking About ${product}`,
        hook: `Stop scrolling: this is the ${product} everyone is raving about.`,
        concept: `High-energy creator-style presentation highlighting 3 distinct reasons (${usps}) why ${strategy.target_audience} chooses ${product}, ending with urgency.`,
        visual_direction: 'Front-facing dynamic framing, on-screen kinetic typography badges, seamless split-screen feature callouts, vibrant saturated color grading.',
        emotional_direction: 'Curious, trendy, persuasive, and urgent.',
        call_to_action: cta,
        estimated_duration: 30,
      },
    ];
  }
}

export const conceptService = new ConceptService();
export default conceptService;
