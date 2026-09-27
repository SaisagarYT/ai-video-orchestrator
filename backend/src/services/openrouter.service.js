import OpenAI from 'openai';
import { config } from '../config/env.js';

let openaiClient = null;

if (config.ai.openrouterApiKey) {
  openaiClient = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.ai.openrouterApiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/SaisagarYT/ai-video-orchestrator',
      'X-Title': 'AI Video Orchestrator',
    },
  });
}

/**
 * Generate structured text/JSON from OpenRouter
 */
export const generateLLMResponse = async ({
  systemPrompt,
  userPrompt,
  model = 'google/gemini-2.0-flash-001',
  jsonMode = false,
  temperature = 0.7,
}) => {
  if (!openaiClient) {
    console.warn('⚠️ OpenRouter API key not configured. Returning mock storyboard response.');
    return getMockStoryboard();
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    });

    const content = response.choices[0]?.message?.content;
    if (jsonMode) {
      try {
        return JSON.parse(content);
      } catch (parseErr) {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      }
    }
    return content;
  } catch (err) {
    console.error('OpenRouter LLM Generation Error:', err.message);
    throw new Error(`LLM Generation failed: ${err.message}`);
  }
};

const getMockStoryboard = () => ({
  conceptTitle: "Unleash Pure Performance",
  logline: "A high-octane 30-second commercial showcasing dynamic product power through dramatic lighting and macro kinetic motion.",
  targetAudience: "Tech enthusiasts and creators aged 20-35",
  criticScore: 9.4,
  scenes: [
    {
      sceneIndex: 1,
      name: "The Hook",
      durationSeconds: 5,
      narrativeText: "Tired of devices that slow you down when you need them most?",
      visualPrompt: "Extreme close-up shot of sleek futuristic product sitting in dramatic low-key rim lighting, cyan and magenta atmospheric haze, photorealistic 8k, product commercial aesthetic.",
      motionPrompt: "Slow cinematic zoom in with subtle rotational tilt around the product.",
      cameraMovement: "Slow Push-In",
    },
    {
      sceneIndex: 2,
      name: "Problem Agitation",
      durationSeconds: 5,
      narrativeText: "Lag and overheating ruin your creative flow.",
      visualPrompt: "Frustrated young creator staring at a frozen screen in a dimly lit studio, high contrast cinematic cinematography, expressive face.",
      motionPrompt: "Fast dynamic push towards the screen displaying error glitches.",
      cameraMovement: "Tracking Shot",
    },
    {
      sceneIndex: 3,
      name: "The Reveal",
      durationSeconds: 6,
      narrativeText: "Meet the next-generation breakthrough engineered for unstoppable speed.",
      visualPrompt: "Explosion of bright neon light as the product ascends gracefully into the air, zero gravity particles swirling around the metallic finish.",
      motionPrompt: "Upward camera pedestal with sweeping orbital arc around the floating product.",
      cameraMovement: "Orbital Pan",
    },
    {
      sceneIndex: 4,
      name: "Feature Showcase",
      durationSeconds: 8,
      narrativeText: "With ultra-fast processing and all-day battery life, your work never stops.",
      visualPrompt: "Split-second montage of high-speed creative workflows: 4K video rendering bar filling instantly, seamless multitasking, ultra crisp high frame rate display.",
      motionPrompt: "Fast whip pan across futuristic digital interfaces and vibrant render timelines.",
      cameraMovement: "Whip Pan",
    },
    {
      sceneIndex: 5,
      name: "Call to Action",
      durationSeconds: 6,
      narrativeText: "Upgrade your workflow today. Tap the link to claim your exclusive launch discount.",
      visualPrompt: "Clean, elegant hero shot of the product next to minimal typographic logo with glowing 'Get Yours Today' button badge, premium studio backdrop.",
      motionPrompt: "Gentle camera pull back with soft studio light sweep over the logo.",
      cameraMovement: "Slow Pull-Out",
    }
  ]
});
