import { generationSpecificationSchema } from './prompt.schema.js';
import { assemblePositivePrompt, DEFAULT_NEGATIVE_PROMPT } from './prompt.templates.js';

export class PromptCompilerService {
  /**
   * Compiles scene parameters and Creative Bible rules into a production-ready Generation Specification
   */
  compileSceneSpecification({
    scene,
    creativeBible = null,
    memoryContext = null,
    targetProvider = 'mock-video',
    aspectRatio = '9:16',
    seed = 42,
  }) {
    // 1. Extract brand memory rules
    const hardRules = memoryContext?.hardConstraints || [];
    const negRules = memoryContext?.negativeConstraints || [];
    const brandConstraintText = hardRules
      .map((r) => (typeof r.value === 'string' ? r.value : JSON.stringify(r.value)))
      .join('. ');

    const style =
      creativeBible?.visual_style ||
      memoryContext?.identity?.visualStyle ||
      '35mm anamorphic cinema look, shallow depth-of-field, organic film grain, 8k resolution';
    const colors =
      creativeBible?.color_palette ||
      (memoryContext?.identity?.brandColors ? `Brand Palette: ${memoryContext.identity.brandColors}` : null) ||
      'High dynamic contrast, curated brand palette with Kodak 5219 LUT grading';
    const lighting = creativeBible?.lighting_rules
      ? `${scene.lighting_atmosphere || ''}. ${creativeBible.lighting_rules}`.trim()
      : scene.lighting_atmosphere || 'Cinematic three-point studio lighting';

    let negative = creativeBible?.negative_prompts || DEFAULT_NEGATIVE_PROMPT;
    if (negRules.length > 0) {
      const extraNegatives = negRules
        .map((r) => (typeof r.value === 'string' ? r.value : JSON.stringify(r.value)))
        .join(', ');
      negative = `${negative}, ${extraNegatives}`;
    }

    const compiledPositivePrompt = assemblePositivePrompt({
      visualPrompt: scene.visual_prompt || 'Cinematic commercial product shot',
      shotType: scene.shot_type || 'Medium Close-Up',
      cameraMovement: scene.camera_movement || 'Subtle Dolly Push-In',
      visualStyle: style,
      lightingDirectives: lighting,
      colorPalette: colors,
      brandConstraints: brandConstraintText || null,
    });

    const spec = {
      scene_id: scene.id || undefined,
      sequence_number: scene.sequence_number || 1,
      compiled_positive_prompt: compiledPositivePrompt,
      compiled_negative_prompt: negative,
      shot_type: scene.shot_type || 'Medium Close-Up',
      camera_movement: scene.camera_movement || 'Subtle Dolly Push-In',
      aspect_ratio: aspectRatio,
      duration_seconds: scene.duration_seconds || 5,
      visual_style: style,
      color_palette: colors,
      lighting_directives: lighting,
      target_provider: targetProvider,
      fps: 24,
      seed,
    };

    return generationSpecificationSchema.parse(spec);
  }
}

export const promptCompilerService = new PromptCompilerService();
export default promptCompilerService;
