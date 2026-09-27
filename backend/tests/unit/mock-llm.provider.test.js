import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { MockLLMProvider } from '../../src/providers/llm/mock-llm.provider.js';

describe('Mock LLM Provider Unit Tests', () => {
  it('should generate free-form text completion with normalized usage and latency', async () => {
    const provider = new MockLLMProvider();
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Generate high-impact ad copy' }],
    });

    assert.ok(res.content);
    assert.equal(res.model, 'mock-llm-v1');
    assert.ok(res.usage.promptTokens > 0);
    assert.ok(res.usage.completionTokens > 0);
    assert.ok(res.usage.totalTokens > 0);
    assert.ok(typeof res.latencyMs === 'number');
  });

  it('should generate structured JSON output matching Zod schema', async () => {
    const provider = new MockLLMProvider();
    const testSchema = z.object({
      campaign_objective: z.string(),
      target_audience: z.string(),
      marketing_angle: z.string(),
      call_to_action: z.string(),
    });

    const res = await provider.generateStructured(
      {
        messages: [{ role: 'user', content: 'Create a MARKETING_STRATEGY for SmartWatch' }],
      },
      testSchema
    );

    assert.ok(res.parsed);
    assert.ok(res.parsed.campaign_objective);
    assert.ok(res.parsed.target_audience);
    assert.ok(res.parsed.call_to_action);
    assert.equal(typeof res.content, 'string');
    assert.ok(JSON.parse(res.content));
  });

  it('should honor custom mock response overrides', async () => {
    const provider = new MockLLMProvider();
    provider.setCustomResponse('CUSTOM_KEYWORD', {
      customStatus: 'success',
      score: 100,
    });

    const customSchema = z.object({
      customStatus: z.string(),
      score: z.number(),
    });

    const res = await provider.generateStructured(
      {
        messages: [{ role: 'user', content: 'Run query with CUSTOM_KEYWORD' }],
      },
      customSchema
    );

    assert.equal(res.parsed.customStatus, 'success');
    assert.equal(res.parsed.score, 100);
  });
});
