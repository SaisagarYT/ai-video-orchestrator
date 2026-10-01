import { REPAIR_OPERATIONS } from './revision.types.js';
import { validateRevisionPlan } from './revision.schema.js';
import { logger } from '../../core/logger/logger.js';

export class RevisionPlanner {
  /**
   * Diagnoses evaluation issues, selectively identifies affected scenes,
   * and maps defects to concrete prompt repair operations.
   *
   * @param {object} params
   * @param {object} params.campaign
   * @param {object} params.evaluationResult
   * @param {Array<object>} [params.scenes]
   * @param {object} [params.creativeBible]
   * @param {number} [params.attemptNumber]
   * @returns {import('./revision.types.js').RevisionPlan}
   */
  planRevision({
    campaign,
    evaluationResult,
    scenes = [],
    creativeBible = {},
    attemptNumber = 1,
  }) {
    if (!campaign || !campaign.id) {
      throw new Error('Valid campaign is required to plan revision');
    }
    if (!evaluationResult) {
      throw new Error('Valid evaluationResult is required to plan revision');
    }

    const issues = evaluationResult.issues || [];
    const instructions = evaluationResult.revisionInstructions || [];
    const dimensions = evaluationResult.dimensions || {};
    const threshold = evaluationResult.threshold || 7.5;

    // 1. Build Diagnostics Summary
    const failedDimensions = [];
    if (dimensions.productFidelity && dimensions.productFidelity.score < threshold) {
      failedDimensions.push({
        dimension: 'productFidelity',
        score: dimensions.productFidelity.score,
        findings: dimensions.productFidelity.findings,
      });
    }
    if (dimensions.brandConsistency && dimensions.brandConsistency.score < threshold) {
      failedDimensions.push({
        dimension: 'brandConsistency',
        score: dimensions.brandConsistency.score,
        findings: dimensions.brandConsistency.findings,
      });
    }
    if (dimensions.visualQuality && dimensions.visualQuality.score < threshold) {
      failedDimensions.push({
        dimension: 'visualQuality',
        score: dimensions.visualQuality.score,
        findings: dimensions.visualQuality.findings,
      });
    }

    const diagnostics = {
      overallScore: evaluationResult.overallScore,
      threshold,
      failedDimensions,
      totalIssuesCount: issues.length,
      criticalCount: issues.filter((i) => i.severity === 'critical').length,
      majorCount: issues.filter((i) => i.severity === 'major').length,
      minorCount: issues.filter((i) => i.severity === 'minor').length,
      attemptNumber,
    };

    // 2. Selectively Identify Affected Scenes
    const normalizedScenes = scenes.map((s, idx) => ({
      id: s.id || `scene-${s.sequence_number || idx + 1}`,
      sequence_number: s.sequence_number ?? s.sceneIndex ?? idx + 1,
      name: s.name || s.shot_type || `Scene ${idx + 1}`,
      visual_prompt: s.visual_prompt || s.description || s.name || '',
      shot_type: s.shot_type || s.name,
      camera_movement: s.camera_movement,
      lighting_atmosphere: s.lighting_atmosphere,
      duration_seconds: s.duration_seconds || s.duration || 5,
    }));

    const affectedSceneIds = new Set();
    const sceneIssuesMap = new Map();

    const findSceneByIdentifier = (identifier) => {
      if (!identifier) return null;
      const str = String(identifier).toLowerCase().trim();
      return (
        normalizedScenes.find((s) => s.id.toLowerCase() === str) ||
        normalizedScenes.find((s) => `scene-${s.sequence_number}` === str) ||
        normalizedScenes.find((s) => `sc-${s.sequence_number}` === str) ||
        normalizedScenes.find((s) => String(s.sequence_number) === str) ||
        null
      );
    };

    const extractSceneNumber = (text) => {
      if (!text) return null;
      const match = text.match(/(?:scene|shot)\s*#?\s*(\d+)/i) || text.match(/(?:sc|scene)[-_](\d+)/i);
      return match ? parseInt(match[1], 10) : null;
    };

    // 2a. Map explicit sceneId in issues
    for (const issue of issues) {
      let matchedScene = null;
      if (issue.sceneId) {
        matchedScene = findSceneByIdentifier(issue.sceneId);
      }

      if (!matchedScene) {
        const extractedNum = extractSceneNumber(issue.description) || extractSceneNumber(issue.evidence);
        if (extractedNum !== null) {
          matchedScene = normalizedScenes.find((s) => s.sequence_number === extractedNum);
        }
      }

      if (matchedScene) {
        affectedSceneIds.add(matchedScene.id);
        if (!sceneIssuesMap.has(matchedScene.id)) {
          sceneIssuesMap.set(matchedScene.id, []);
        }
        sceneIssuesMap.get(matchedScene.id).push(issue);
      }
    }

    // 2b. Map scene references in revision instructions
    for (const instruction of instructions) {
      const extractedNum = extractSceneNumber(instruction);
      if (extractedNum !== null) {
        const matchedScene = normalizedScenes.find((s) => s.sequence_number === extractedNum);
        if (matchedScene) {
          affectedSceneIds.add(matchedScene.id);
          if (!sceneIssuesMap.has(matchedScene.id)) {
            sceneIssuesMap.set(matchedScene.id, []);
          }
          sceneIssuesMap.get(matchedScene.id).push({
            severity: 'major',
            category: 'visual',
            description: instruction,
          });
        }
      }
    }

    // 2c. Fallback for unassigned issues / dimension failures
    if (affectedSceneIds.size === 0 && normalizedScenes.length > 0) {
      // If product fidelity failed, find the hero product shot (or scene 2)
      if (dimensions.productFidelity && dimensions.productFidelity.score < threshold) {
        const productScene =
          normalizedScenes.find(
            (s) =>
              campaign.product_name &&
              s.visual_prompt.toLowerCase().includes(campaign.product_name.toLowerCase())
          ) ||
          normalizedScenes.find((s) => /product|packshot|hero/i.test(s.name)) ||
          normalizedScenes[Math.min(1, normalizedScenes.length - 1)]; // Scene 2 or first
        affectedSceneIds.add(productScene.id);
        sceneIssuesMap.set(productScene.id, issues);
      } else if (dimensions.visualQuality && dimensions.visualQuality.score < threshold) {
        // If visual quality failed, select the hook scene (Scene 1)
        const hookScene = normalizedScenes[0];
        affectedSceneIds.add(hookScene.id);
        sceneIssuesMap.set(hookScene.id, issues);
      } else {
        // Default to Scene 2 (core demonstration scene)
        const targetScene = normalizedScenes[Math.min(1, normalizedScenes.length - 1)];
        affectedSceneIds.add(targetScene.id);
        sceneIssuesMap.set(targetScene.id, issues);
      }
    }

    // 3. Construct Targets and Structured Operations
    const targets = [];
    for (const sceneId of affectedSceneIds) {
      const scene = normalizedScenes.find((s) => s.id === sceneId);
      if (!scene) continue;

      const sceneIssues = sceneIssuesMap.get(sceneId) || [];
      const operations = [];

      const addOp = (type, rule, rationale) => {
        if (!operations.some((op) => op.type === type && op.rule === rule)) {
          operations.push({ type, rule, rationale });
        }
      };

      // Check issues associated with this scene
      for (const issue of sceneIssues) {
        const cat = issue.category || 'visual';
        const desc = (issue.description || '').toLowerCase();

        if (cat === 'product' || desc.includes('product') || desc.includes('logo')) {
          addOp(
            REPAIR_OPERATIONS.ADD_CONSTRAINT,
            `Ensure ${campaign.product_name || 'product'} is centered, pristine, and prominently featured in clear focus.`,
            'Fix product fidelity and logo prominence'
          );
          addOp(
            REPAIR_OPERATIONS.ENHANCE_BRANDING,
            `Incorporate authentic brand visual styling for ${campaign.product_name || 'the brand'}.`,
            'Reinforce brand recognition'
          );
        }

        if (cat === 'visual' || desc.includes('lighting') || desc.includes('dark') || desc.includes('blurry')) {
          addOp(
            REPAIR_OPERATIONS.CORRECT_LIGHTING,
            'High-contrast professional commercial studio lighting with clean key light and balanced fill.',
            'Correct dim or uneven scene illumination'
          );
          addOp(
            REPAIR_OPERATIONS.STRENGTHEN_DESCRIPTION,
            'Sharp focus, 8k UHD commercial cinematography, hyper-detailed textures, pristine clarity.',
            'Eliminate visual blur and artifacts'
          );
          addOp(
            REPAIR_OPERATIONS.REMOVE_CONFLICT,
            'dim, murky, shadowy, dark, noisy, low resolution, blurry',
            'Remove conflicting aesthetic terms'
          );
        }

        if (cat === 'brand' || desc.includes('tone') || desc.includes('consistency')) {
          addOp(
            REPAIR_OPERATIONS.PRESERVE_IDENTITY,
            `Adhere strictly to brand identity guidelines and color palette (${creativeBible?.visualStyle?.colorPalette || 'modern commercial'}).`,
            'Restore brand consistency'
          );
        }

        if (cat === 'technical' || desc.includes('camera') || desc.includes('jitter')) {
          addOp(
            REPAIR_OPERATIONS.CORRECT_CAMERA,
            'Smooth, stabilized camera trajectory aligned with professional commercial standards.',
            'Stabilize camera motion'
          );
        }
      }

      // If no specific operations were added from issues, supply default self-healing operations
      if (operations.length === 0) {
        addOp(
          REPAIR_OPERATIONS.ADD_CONSTRAINT,
          `Prominently showcase ${campaign.product_name || 'the product'} with crisp focal clarity and zero distortion.`,
          'Standard revision constraint'
        );
        addOp(
          REPAIR_OPERATIONS.CORRECT_LIGHTING,
          'Crisp, commercial studio lighting with balanced exposure.',
          'Standard lighting correction'
        );
      }

      targets.push({
        sceneId: scene.id,
        sceneIndex: scene.sequence_number,
        issues: sceneIssues,
        operations,
        originalPrompt: scene.visual_prompt || `Commercial shot of ${campaign.product_name}`,
        status: 'PENDING',
      });
    }

    // 4. Identify Unaffected Scenes (Preserved!)
    const unaffectedSceneIds = normalizedScenes
      .filter((s) => !affectedSceneIds.has(s.id))
      .map((s) => s.id);

    const rawPlan = {
      campaignId: campaign.id,
      workflowExecutionId: evaluationResult.workflowExecutionId || null,
      evaluationId: evaluationResult.evaluationId || evaluationResult.id || 'eval-source',
      attemptNumber,
      targets,
      unaffectedSceneIds,
      diagnostics,
    };

    logger.info(
      `[RevisionPlanner] Planned revision attempt ${attemptNumber}: ${targets.length} affected scene(s) [${targets.map((t) => t.sceneId).join(', ')}], ${unaffectedSceneIds.length} preserved scene(s)`
    );

    return validateRevisionPlan(rawPlan);
  }
}

export const revisionPlanner = new RevisionPlanner();
