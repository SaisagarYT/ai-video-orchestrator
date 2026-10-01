import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  RevisionPolicy,
  revisionPolicy,
} from '../../src/services/revision/revision.policy.js';
import { MAX_REVISION_ATTEMPTS } from '../../src/services/revision/revision.types.js';

describe('RevisionPolicy Unit Tests', () => {
  it('should initialize with default MAX_REVISION_ATTEMPTS = 2', () => {
    assert.equal(revisionPolicy.maxAttempts, 2);
    assert.equal(MAX_REVISION_ATTEMPTS, 2);
  });

  it('should disallow revision if evaluation already passed', () => {
    const result = revisionPolicy.canRevise({
      attemptCount: 0,
      evaluationResult: { passed: true, overallScore: 8.5 },
    });

    assert.equal(result.allowed, false);
    assert.equal(result.exhausted, false);
    assert.match(result.reason, /already passed/i);
  });

  it('should allow revision attempt 1 when initial evaluation failed', () => {
    const result = revisionPolicy.canRevise({
      attemptCount: 0,
      evaluationResult: { passed: false, overallScore: 6.2 },
    });

    assert.equal(result.allowed, true);
    assert.equal(result.nextAttemptNumber, 1);
    assert.equal(result.exhausted, false);
  });

  it('should allow revision attempt 2 when attempt 1 failed', () => {
    const result = revisionPolicy.canRevise({
      attemptCount: 1,
      evaluationResult: { passed: false, overallScore: 6.9 },
    });

    assert.equal(result.allowed, true);
    assert.equal(result.nextAttemptNumber, 2);
    assert.equal(result.exhausted, false);
  });

  it('should disallow revision and mark exhausted when attemptCount reaches maxAttempts', () => {
    const result = revisionPolicy.canRevise({
      attemptCount: 2,
      evaluationResult: { passed: false, overallScore: 7.1 },
    });

    assert.equal(result.allowed, false);
    assert.equal(result.exhausted, true);
    assert.match(result.reason, /maximum autonomous revision attempts/i);
  });

  it('should generate deterministic idempotency keys for scene regeneration', () => {
    const key1 = revisionPolicy.generateSceneIdempotencyKey('exec-100', 'scene-2', 1);
    const key2 = revisionPolicy.generateSceneIdempotencyKey('exec-100', 'scene-2', 1);
    const keyAttempt2 = revisionPolicy.generateSceneIdempotencyKey('exec-100', 'scene-2', 2);

    assert.equal(key1, 'revision-scene:exec-100:scene-2:att-1');
    assert.equal(key1, key2);
    assert.notEqual(key1, keyAttempt2);
  });

  it('should generate deterministic render idempotency keys for revision attempts', () => {
    const key1 = revisionPolicy.generateRenderIdempotencyKey('camp-1', 'exec-1', 1);
    const key2 = revisionPolicy.generateRenderIdempotencyKey('camp-1', 'exec-1', 1);
    const keyRev2 = revisionPolicy.generateRenderIdempotencyKey('camp-1', 'exec-1', 2);

    assert.equal(key1, 'camp-1:exec-1:render:rev-1');
    assert.equal(key1, key2);
    assert.notEqual(key1, keyRev2);
  });

  it('should evaluate canAcceptWithWarning based on severity and score threshold proximity', () => {
    // Score near threshold (>= 6.5) with no critical issues
    const nearPassing = revisionPolicy.canAcceptWithWarning({
      overallScore: 7.2,
      issues: [{ severity: 'minor', description: 'Small contrast gap' }],
    });
    assert.equal(nearPassing, true);

    // Score near threshold but contains critical defect -> cannot accept
    const withCritical = revisionPolicy.canAcceptWithWarning({
      overallScore: 7.2,
      issues: [{ severity: 'critical', description: 'Logo completely missing' }],
    });
    assert.equal(withCritical, false);

    // Score far below threshold (< 6.5) -> cannot accept
    const tooLow = revisionPolicy.canAcceptWithWarning({
      overallScore: 5.5,
      issues: [{ severity: 'minor', description: 'Aesthetic defect' }],
    });
    assert.equal(tooLow, false);
  });
});
