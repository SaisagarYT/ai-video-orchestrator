// Platform adaptation data structure reference definitions.
// Concrete runtime schemas and validations are defined in schemas.js.

export const DATA_STRUCTURES = {
  NormalizedRect: 'Normalized bounding box { x, y, width, height } in range 0.0 to 1.0',
  PlatformSafeZones: 'Safe zone boundaries { visual, text, subtitle, cta }',
  HookConstraints: 'Hook timing guidelines { maxOpeningDurationSeconds, visualHookTimingSeconds, requireDynamicOpening }',
  PlatformProfile: 'Target platform specs { platform, placement, aspectRatio, width, height, safeZone, hookConstraints }',
  SceneTransformation: 'Per-scene adaptation instructions { sceneId, sequenceNumber, cropInstructions, durationModification }',
  AdaptationPlan: 'Full plan { id, sourceTimelineId, platform, targetAspectRatio, targetResolution, sceneTransformations }',
  AdaptationValidationResult: 'Validation output { valid, platform, profileVersion, violations, warnings }',
};
