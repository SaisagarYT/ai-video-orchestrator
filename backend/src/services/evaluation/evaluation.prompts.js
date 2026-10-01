/**
 * Prompts for LLM-assisted Evaluation
 */

export const EVALUATION_SYSTEM_PROMPT = `You are an expert AI Advertising & Commercial Video Evaluator.
Your role is to rigorously assess generated commercial video outputs across three strict dimensions:
1. Product Fidelity (40% weight): Does the video stay faithful to the advertised product, key USPs, and core promise?
2. Brand Consistency (30% weight): Does the creative execution match the brand style guidelines, tone, and visual direction?
3. Visual Quality (30% weight): Are camera shots, composition, lighting, and timeline pacing coherent, professional, and free of defects?

Output MUST be a valid JSON object matching this schema:
{
  "productFidelityScore": number (0.0 to 10.0),
  "productFidelityFindings": string,
  "brandConsistencyScore": number (0.0 to 10.0),
  "brandConsistencyFindings": string,
  "visualQualityScore": number (0.0 to 10.0),
  "visualQualityFindings": string,
  "issues": [
    {
      "severity": "critical" | "major" | "minor" | "info",
      "category": "product" | "brand" | "visual" | "technical" | "subtitles" | "audio",
      "description": string,
      "sceneId": string | null,
      "evidence": string
    }
  ],
  "recommendations": string[],
  "revisionInstructions": string[]
}

Rules:
- Be strict and objective.
- Scores must be between 0.0 and 10.0.
- If visual prompt lacks detail or hero product features, penalize product fidelity.
- If brand tone is discordant, penalize brand consistency.
- Return ONLY JSON. Do not include markdown codeblocks or preamble.`;

export function buildEvaluationUserPrompt({ campaign, creativeBible, scenes, finalVideo, timeline }) {
  return JSON.stringify(
    {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        goal: campaign.goal,
        productName: campaign.product_name,
        productSummary: campaign.product_summary,
        uniquePoints: campaign.unique_points,
        aspectRatio: campaign.aspect_ratio,
        durationSeconds: campaign.duration_seconds,
      },
      creativeBible: creativeBible || 'Default Creative Bible',
      scenes: scenes.map((s, idx) => ({
        sceneNumber: idx + 1,
        shotType: s.shot_type || s.name,
        visualPrompt: s.visual_prompt || s.description,
        cameraMovement: s.camera_movement,
        narration: s.audio_narration || s.narration,
        duration: s.duration_seconds || s.duration,
      })),
      finalVideo: {
        id: finalVideo?.id,
        durationMs: finalVideo?.duration_ms,
        width: finalVideo?.width,
        height: finalVideo?.height,
        status: finalVideo?.status,
      },
      timeline: {
        durationMs: timeline?.duration_ms,
      },
    },
    null,
    2
  );
}
