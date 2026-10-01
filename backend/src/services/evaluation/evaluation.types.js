/**
 * Evaluation Types & Domain Constants
 *
 * @typedef {'critical' | 'major' | 'minor' | 'info'} IssueSeverity
 * @typedef {'product' | 'brand' | 'visual' | 'technical' | 'subtitles' | 'audio'} IssueCategory
 *
 * @typedef {object} EvaluationIssue
 * @property {IssueSeverity} severity
 * @property {IssueCategory} category
 * @property {string} description
 * @property {string} [sceneId]
 * @property {string} [evidence]
 *
 * @typedef {object} DimensionScore
 * @property {number} score - Score between 0.0 and 10.0
 * @property {number} weight - Relative weight (0.0 to 1.0)
 * @property {number} weightedScore - score * weight
 * @property {string} findings - Qualitative and diagnostic findings
 *
 * @typedef {object} TechnicalChecks
 * @property {boolean} videoReadable - Video container and stream are readable
 * @property {boolean} durationValid - Duration matches campaign and timeline target
 * @property {boolean} resolutionValid - Output resolution matches requested canvas
 * @property {boolean} aspectRatioValid - Aspect ratio matches requested target
 * @property {boolean} audioPresent - Audio track is present when expected
 * @property {boolean} subtitlesValid - Subtitles are valid and synchronized when enabled
 *
 * @typedef {object} EvaluationResult
 * @property {string} evaluationVersion
 * @property {string} campaignId
 * @property {string} [workflowExecutionId]
 * @property {string} [finalVideoId]
 * @property {number} overallScore
 * @property {number} threshold
 * @property {boolean} passed
 * @property {{ productFidelity: DimensionScore, brandConsistency: DimensionScore, visualQuality: DimensionScore }} dimensions
 * @property {TechnicalChecks} technicalChecks
 * @property {Array<EvaluationIssue>} issues
 * @property {Array<string>} recommendations
 * @property {Array<string>} revisionInstructions
 * @property {Record<string, any>} metadata
 */

export const EVALUATION_VERSION = '1.0';

export const DEFAULT_EVALUATION_THRESHOLD = 7.5;

export const DEFAULT_DIMENSION_WEIGHTS = {
  productFidelity: 0.40,
  brandConsistency: 0.30,
  visualQuality: 0.30,
};

export const EVALUATION_STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
};

export const ISSUE_SEVERITY = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
  INFO: 'info',
};

export const ISSUE_CATEGORY = {
  PRODUCT: 'product',
  BRAND: 'brand',
  VISUAL: 'visual',
  TECHNICAL: 'technical',
  SUBTITLES: 'subtitles',
  AUDIO: 'audio',
};
