import { LLMProvider } from './llm.provider.js';

export class MockLLMProvider extends LLMProvider {
  constructor(options = {}) {
    super('mock', options);
    this.customResponses = new Map();
  }

  setCustomResponse(key, response) {
    this.customResponses.set(key, response);
  }

  clearCustomResponses() {
    this.customResponses.clear();
  }

  async complete(request) {
    const startTime = Date.now();
    const promptText = (request.messages || []).map((m) => m.content).join(' ');

    let content = 'Mock LLM Response generated for development and testing.';
    for (const [key, val] of this.customResponses.entries()) {
      if (promptText.includes(key)) {
        content = typeof val === 'function' ? await val(request) : val;
        break;
      }
    }

    const latencyMs = Math.max(1, Date.now() - startTime);
    return {
      content: typeof content === 'string' ? content : JSON.stringify(content),
      model: request.model || 'mock-llm-v1',
      usage: {
        promptTokens: Math.round(promptText.length / 4) + 10,
        completionTokens: 50,
        totalTokens: Math.round(promptText.length / 4) + 60,
      },
      latencyMs,
    };
  }

  async generateStructured(request, schema) {
    const startTime = Date.now();
    const promptText = (request.messages || []).map((m) => m.content).join(' ');

    for (const [key, val] of this.customResponses.entries()) {
      if (promptText.includes(key)) {
        const rawData = typeof val === 'function' ? await val(request) : val;
        const parsed = schema ? schema.parse(rawData) : rawData;
        return {
          content: JSON.stringify(parsed),
          parsed,
          model: request.model || 'mock-llm-v1',
          usage: { promptTokens: 100, completionTokens: 80, totalTokens: 180 },
          latencyMs: Math.max(1, Date.now() - startTime),
        };
      }
    }

    let generatedData = null;

    if (promptText.includes('MARKETING_STRATEGY') || promptText.includes('strategy')) {
      generatedData = {
        campaign_objective: 'Drive App Installs & Conversions',
        target_audience: 'Gen Z & Active Urban Tech Enthusiasts (18-35)',
        marketing_angle: 'Highlighting breakthrough performance and instant ease-of-use',
        core_message: 'Upgrade your daily performance with modern intelligence.',
        call_to_action: 'Download now on iOS & Android',
        tone: 'Energetic, Premium & Engaging',
        recommended_platform: 'Instagram Reels & TikTok',
        recommended_format: 'Short-form vertical video (9:16, 15-30s) with high-retention hook',
      };
    } else if (promptText.includes('CREATIVE_CONCEPTS') || promptText.includes('concepts')) {
      generatedData = {
        concepts: [
          {
            title: 'The Instant Rush',
            hook: 'Stop settling for ordinary performance.',
            concept: 'A dynamic whip-pan montage showcasing speed and sleek industrial design.',
            visual_direction: 'Fast speed ramps, high-contrast studio rim lighting, 35mm anamorphic.',
            emotional_direction: 'Empowering, energetic, and modern.',
            call_to_action: 'Get started today.',
            estimated_duration: 15,
          },
          {
            title: 'Everyday Superpower',
            hook: 'What if your daily grind felt effortless?',
            concept: 'Relatable problem-solution narrative demonstrating seamless product benefits.',
            visual_direction: 'Warm natural lighting, fluid tracking shots, genuine user reactions.',
            emotional_direction: 'Relatable, satisfying, and confidence-inspiring.',
            call_to_action: 'Claim your exclusive 20% discount now.',
            estimated_duration: 30,
          },
        ],
      };
    } else if (promptText.includes('CREATIVE_BIBLE') || promptText.includes('storyboard')) {
      generatedData = {
        creative_bible: {
          visual_style: '35mm anamorphic cinema look, ARRI Alexa sensor grade, organic 35mm film grain',
          color_palette: 'High-contrast obsidian, electric cyan (#00F0FF), warm golden highlights',
          lighting_rules: 'Directional sculpted key lighting with vibrant rim lights and volumetric atmospheric haze',
          voiceover_profile: 'Confident, resonant narrator with conversational cadence',
          music_sound_design: 'Rhythmic electronic pulse building into an epic cinematic drop with crisp foley',
          negative_prompts: 'blurry, distorted textures, oversaturated plastic cartoon, deformed hands, text watermarks',
        },
        scenes: [
          {
            sequence_number: 1,
            shot_type: 'Dynamic Extreme Close-Up (ECU)',
            camera_movement: 'Rapid Push-In with Speed Ramp',
            visual_prompt: 'Extreme macro close-up of sleek product texture under dramatic neon rim lighting.',
            audio_narration: 'Ready to experience the future?',
            duration_seconds: 4,
            lighting_atmosphere: 'Dark obsidian background with razor-sharp volumetric lighting.',
          },
          {
            sequence_number: 2,
            shot_type: 'Medium Action Dolly',
            camera_movement: 'Fluid Orbital Pan',
            visual_prompt: 'Protagonist using product effortlessly in an urban high-tech workspace.',
            audio_narration: 'Engineered for those who refuse to settle.',
            duration_seconds: 6,
            lighting_atmosphere: 'Warm sunlight through glass windows balanced with cool interior fill.',
          },
          {
            sequence_number: 3,
            shot_type: 'Hero Feature Reveal',
            camera_movement: '360 Degree Slow Rotation',
            visual_prompt: 'Full hero product reveal showcasing flagship features in immaculate detail.',
            audio_narration: 'Precision engineering in every single detail.',
            duration_seconds: 8,
            lighting_atmosphere: 'High-key studio commercial lighting with subtle lens flares.',
          },
          {
            sequence_number: 4,
            shot_type: 'End Card Brand Lockup',
            camera_movement: 'Majestic Slow Pull-Back to Static',
            visual_prompt: 'Center-framed product lockup with prominent call to action and glowing brand badge.',
            audio_narration: 'Order now and claim your launch discount.',
            duration_seconds: 4,
            lighting_atmosphere: 'Crisp luxury studio gradient with soft background bokeh.',
          },
        ],
      };
    } else if (promptText.includes('PROMPT_COMPILER') || promptText.includes('scene_specification')) {
      generatedData = {
        compiled_positive_prompt: 'Cinematic 9:16 commercial hero shot. Photorealistic 8k render, ARRI Alexa 65.',
        compiled_negative_prompt: 'blurry, low quality, distorted, artifacts, watermarks',
        shot_type: 'Macro Hero Product Showcase',
        camera_movement: '360° Circular Sweep with Smooth Tilt Up',
        aspect_ratio: '9:16',
        duration_seconds: 5,
        fps: 24,
        seed: 42,
      };
    } else {
      generatedData = {
        success: true,
        message: 'Mock structured output generated',
        data: { text: 'Default structured payload' },
      };
    }

    const parsed = schema ? schema.parse(generatedData) : generatedData;
    const latencyMs = Math.max(1, Date.now() - startTime);

    return {
      content: JSON.stringify(parsed),
      parsed,
      model: request.model || 'mock-llm-v1',
      usage: {
        promptTokens: Math.round(promptText.length / 4) + 15,
        completionTokens: Math.round(JSON.stringify(parsed).length / 4),
        totalTokens: Math.round(promptText.length / 4) + Math.round(JSON.stringify(parsed).length / 4) + 15,
      },
      latencyMs,
    };
  }
}

export default MockLLMProvider;
