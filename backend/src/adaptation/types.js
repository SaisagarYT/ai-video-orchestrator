/**
 * @typedef {object} NormalizedRect
 * @property {number} x - Normalized x coordinate (0.0 to 1.0)
 * @property {number} y - Normalized y coordinate (0.0 to 1.0)
 * @property {number} width - Normalized width (0.0 to 1.0)
 * @property {number} height - Normalized height (0.0 to 1.0)
 */

/**
 * @typedef {object} PlatformSafeZones
 * @property {NormalizedRect} visual - Primary visual action safe zone
 * @property {NormalizedRect} text - Text and title safe zone
 * @property {NormalizedRect} subtitle - Subtitle placement safe zone
 * @property {NormalizedRect} cta - Call-to-action button/endcard safe zone
 */

/**
 * @typedef {object} HookConstraints
 * @property {number} maxOpeningDurationSeconds
 * @property {number} visualHookTimingSeconds
 * @property {boolean} requireDynamicOpening
 */

/**
 * @typedef {object} PlatformProfile
 * @property {string} platform - Platform key (e.g. TIKTOK, INSTAGRAM_REELS)
 * @property {string} placement - Placement name (e.g. story, reel, feed)
 * @property {string} version - Profile version (e.g. v1)
 * @property {'9:16'|'16:9'|'1:1'} aspectRatio - Target aspect ratio
 * @property {number} width - Target pixel width
 * @property {number} height - Target pixel height
 * @property {number} minDurationSeconds - Minimum allowable video duration
 * @property {number} maxDurationSeconds - Maximum allowable video duration
 * @property {number} recommendedDurationSeconds - Ideal video duration
 * @property {PlatformSafeZones} safeZone - Normalized safe zone bounding boxes
 * @property {HookConstraints} hookConstraints - Hook timing guidelines
 * @property {string} cropStrategy - Default crop strategy
 * @property {object} audioRequirements - Audio specs (format, loudness)
 * @property {object} metadata - Descriptive profile metadata
 */

/**
 * @typedef {object} SceneTransformation
 * @property {string} sceneId
 * @property {number} sequenceNumber
 * @property {object} cropInstructions
 * @property {object} [subjectPreservation]
 * @property {object} durationModification
 * @property {object} textTransformations
 * @property {object} subtitleTransformations
 * @property {object} ctaTransformations
 */

/**
 * @typedef {object} AdaptationPlan
 * @property {string} id
 * @property {string} sourceTimelineId
 * @property {string} sourceTimelineVersion
 * @property {string} platform
 * @property {string} platformProfileVersion
 * @property {'9:16'|'16:9'|'1:1'} targetAspectRatio
 * @property {{ width: number, height: number }} targetResolution
 * @property {number} targetDurationSeconds
 * @property {Array<SceneTransformation>} sceneTransformations
 * @property {object} audioTransformations
 * @property {string} validationStatus
 * @property {object} provenance
 */

/**
 * @typedef {object} PlatformViolation
 * @property {string} code
 * @property {'ERROR'|'WARNING'} severity
 * @property {string} [sceneId]
 * @property {string} message
 * @property {string} [correction]
 */

/**
 * @typedef {object} AdaptationValidationResult
 * @property {boolean} valid
 * @property {string} platform
 * @property {string} profileVersion
 * @property {Array<PlatformViolation>} violations
 * @property {Array<object>} warnings
 */
