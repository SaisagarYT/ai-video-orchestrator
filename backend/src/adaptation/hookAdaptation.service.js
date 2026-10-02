export class HookAdaptationService {
  // Analyze the opening scene and generate platform hook adaptation instructions
  static planHookAdaptation({ firstScene, profile, creativeMemory = null }) {
    if (!firstScene) {
      return {
        strategy: 'PRESERVE_HOOK',
        openingDurationSeconds: 3,
        adjustedDurationSeconds: 3,
        reason: 'No first scene provided; using profile default',
        regenerationRequired: false,
      };
    }

    const maxOpening = profile.hookConstraints?.maxOpeningDurationSeconds || 3;
    const currentDuration = Number(firstScene.duration_seconds || firstScene.duration || 5);

    let adjustedDuration = currentDuration;
    let strategy = 'PRESERVE_HOOK';
    let reason = 'Opening scene satisfies platform hook timing constraints';

    if (currentDuration > maxOpening) {
      adjustedDuration = maxOpening;
      strategy = 'TRIM_HOOK_SCENE';
      reason = `Trim opening hook from ${currentDuration}s to ${maxOpening}s to adhere to ${profile.platform} initial drop-off constraints`;
    }

    return {
      sceneId: String(firstScene.id || 'scene-1'),
      strategy,
      originalDurationSeconds: currentDuration,
      adjustedDurationSeconds: adjustedDuration,
      visualHookTimingSeconds: profile.hookConstraints?.visualHookTimingSeconds || 1.5,
      requireDynamicOpening: Boolean(profile.hookConstraints?.requireDynamicOpening),
      reason,
      regenerationRequired: false,
    };
  }
}
