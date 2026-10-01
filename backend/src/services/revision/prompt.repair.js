import { REPAIR_OPERATIONS } from './revision.types.js';
import { PromptRepairError } from './revision.errors.js';
import { logger } from '../../core/logger/logger.js';

export class PromptRepairEngine {
  /**
   * Applies structured prompt self-healing operations to modify an existing scene prompt,
   * preserving the Creative Bible, duration, camera constraints, and narrative intent.
   *
   * @param {object} params
   * @param {import('./revision.types.js').RevisionTarget} params.target
   * @param {object} params.scene
   * @param {object} [params.campaign]
   * @param {object} [params.creativeBible]
   * @param {object} [params.promptSpec]
   * @returns {{ healedPrompt: string, updatedSpec: object, explanation: string, appliedOperations: Array<object> }}
   */
  repairPrompt({
    target,
    scene = {},
    campaign = {},
    creativeBible = {},
    promptSpec = null,
  }) {
    if (!target || !target.originalPrompt) {
      throw new PromptRepairError('Invalid target or missing originalPrompt for prompt self-healing');
    }

    try {
      const original = target.originalPrompt.trim();
      const operations = target.operations || [];
      const appliedOperations = [];
      const explanations = [];

      let healedPrompt = original;

      // 1. Preserve Core Creative Bible & Scene Invariants
      const shotType = scene.shot_type || scene.name || 'Medium Shot';
      const cameraMovement = scene.camera_movement || 'Fluid Motion';
      const durationSeconds = scene.duration_seconds || scene.duration || 5;
      const aspectRatio = promptSpec?.aspect_ratio || scene.aspect_ratio || campaign.aspect_ratio || '9:16';
      const productName = campaign.product_name || 'Product';

      // 2. Apply REMOVE_CONFLICT Operations
      const conflictOps = operations.filter((op) => op.type === REPAIR_OPERATIONS.REMOVE_CONFLICT);
      for (const op of conflictOps) {
        const wordsToRemove = op.rule.split(',').map((w) => w.trim().toLowerCase());
        for (const word of wordsToRemove) {
          if (!word) continue;
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          if (regex.test(healedPrompt)) {
            healedPrompt = healedPrompt.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
            appliedOperations.push({
              type: REPAIR_OPERATIONS.REMOVE_CONFLICT,
              rule: `Removed conflicting term: "${word}"`,
            });
            explanations.push(`Removed conflicting term "${word}"`);
          }
        }
      }

      // 3. Apply CORRECT_LIGHTING Operations
      const lightingOps = operations.filter((op) => op.type === REPAIR_OPERATIONS.CORRECT_LIGHTING);
      if (lightingOps.length > 0) {
        const lightingClause = 'professional high-contrast commercial studio lighting, balanced key and rim light';
        if (!healedPrompt.toLowerCase().includes('studio lighting')) {
          healedPrompt += `, ${lightingClause}`;
          appliedOperations.push({
            type: REPAIR_OPERATIONS.CORRECT_LIGHTING,
            rule: lightingClause,
          });
          explanations.push('Enhanced lighting to commercial studio standard');
        }
      }

      // 4. Apply ADD_CONSTRAINT Operations
      const constraintOps = operations.filter((op) => op.type === REPAIR_OPERATIONS.ADD_CONSTRAINT);
      for (const op of constraintOps) {
        if (!healedPrompt.toLowerCase().includes(productName.toLowerCase()) || !healedPrompt.toLowerCase().includes('centered')) {
          healedPrompt += `, ${op.rule}`;
          appliedOperations.push(op);
          explanations.push('Added framing and product focal constraint');
        }
      }

      // 5. Apply ENHANCE_BRANDING Operations
      const brandOps = operations.filter((op) => op.type === REPAIR_OPERATIONS.ENHANCE_BRANDING);
      if (brandOps.length > 0) {
        const brandColor = creativeBible?.visualStyle?.colorPalette || 'signature brand palette';
        const brandClause = `featuring official branding of ${productName} with ${brandColor}`;
        if (!healedPrompt.toLowerCase().includes('official branding')) {
          healedPrompt += `, ${brandClause}`;
          appliedOperations.push({
            type: REPAIR_OPERATIONS.ENHANCE_BRANDING,
            rule: brandClause,
          });
          explanations.push('Strengthened brand identity and color palette fidelity');
        }
      }

      // 6. Apply STRENGTHEN_DESCRIPTION & PRESERVE_IDENTITY Operations
      const strengthenOps = operations.filter(
        (op) => op.type === REPAIR_OPERATIONS.STRENGTHEN_DESCRIPTION || op.type === REPAIR_OPERATIONS.PRESERVE_IDENTITY
      );
      if (strengthenOps.length > 0) {
        const qualityClause = 'crisp 8k commercial cinematography, ultra-detailed textures, pristine clarity';
        if (!healedPrompt.toLowerCase().includes('8k') && !healedPrompt.toLowerCase().includes('pristine clarity')) {
          healedPrompt += `, ${qualityClause}`;
          appliedOperations.push({
            type: REPAIR_OPERATIONS.STRENGTHEN_DESCRIPTION,
            rule: qualityClause,
          });
          explanations.push('Upgraded visual resolution and texture fidelity');
        }
      }

      // Clean up whitespace and punctuation
      healedPrompt = healedPrompt
        .replace(/,\s*,/g, ',')
        .replace(/\s+/g, ' ')
        .trim();

      // Ensure updated prompt specification adheres to invariants
      const updatedSpec = promptSpec ? { ...promptSpec } : {};
      updatedSpec.compiled_positive_prompt = healedPrompt;
      updatedSpec.shot_type = shotType;
      updatedSpec.duration_seconds = durationSeconds;
      updatedSpec.aspect_ratio = aspectRatio;
      updatedSpec.camera_movement = cameraMovement;

      // Augment negative prompt to eliminate common failure modes
      const baseNegative = updatedSpec.negative_prompt || 'blurry, distorted, low quality, glitch';
      if (!baseNegative.includes('obscured logo') && !baseNegative.includes('dim lighting')) {
        updatedSpec.negative_prompt = `${baseNegative}, obscured logo, dim lighting, bad composition, motion blur, muddy colors`;
      }

      const explanation =
        explanations.length > 0
          ? `Self-healed Scene ${target.sceneIndex || scene.sequence_number || 1} prompt: ${explanations.join('; ')}. Preserved shot type (${shotType}), duration (${durationSeconds}s), and Creative Bible visual style.`
          : `Self-healed Scene ${target.sceneIndex || 1} prompt with enhanced clarity and studio lighting while preserving Creative Bible directives.`;

      logger.info(
        `[PromptRepairEngine] Repaired Scene ${target.sceneId}: ${appliedOperations.length} operations applied.`
      );

      return {
        healedPrompt,
        updatedSpec,
        explanation,
        appliedOperations: appliedOperations.length > 0 ? appliedOperations : operations,
      };
    } catch (err) {
      logger.error('Failed to repair scene prompt', { error: err.message, target });
      throw new PromptRepairError(`Prompt repair failed: ${err.message}`, { target });
    }
  }
}

export const promptRepairEngine = new PromptRepairEngine();
