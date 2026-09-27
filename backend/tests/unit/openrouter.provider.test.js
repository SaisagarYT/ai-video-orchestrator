import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { OpenRouterLLMProvider } from '../../src/providers/llm/openrouter.provider.js';
import {
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderResponseError,
} from '../../src/providers/core/provider.errors.js';

describe('OpenRouter LLM Provider Unit Tests', () => {
  const originalFetch = global.fetch;
  const testApiKey = 'sk-or-v1-secret-test-key-999999999';

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should throw ProviderAuthenticationError if API key is missing', async () => {
    const provider = new OpenRouterLLMProvider({ apiKey: '' });
    await assert.rejects(
      async () => {
        await provider.complete({ messages: [{ role: 'user', content: 'hello' }] });
      },
      (err) => err instanceof ProviderAuthenticationError
    );
  });

  it('should complete chat request with token usage and latency when API succeeds', async () => {
    global.fetch = async (url, options) => {
      assert.ok(url.includes('/chat/completions'));
      assert.equal(options.headers.Authorization, `Bearer ${testApiKey}`);

      return new Response(
        JSON.stringify({
          id: 'gen-1234',
          model: 'anthropic/claude-3.5-sonnet',
          choices: [{ message: { role: 'assistant', content: 'High impact commercial script' } }],
          usage: { prompt_tokens: 15, completion_tokens: 30, total_tokens: 45 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const provider = new OpenRouterLLMProvider({ apiKey: testApiKey });
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Generate script' }],
    });

    assert.equal(res.content, 'High impact commercial script');
    assert.equal(res.usage.promptTokens, 15);
    assert.equal(res.usage.completionTokens, 30);
    assert.equal(res.usage.totalTokens, 45);
  });

  it('should generate structured JSON matching Zod schema', async () => {
    const mockJson = {
      title: 'Ultra Glow',
      duration: 30,
      scenes: 4,
    };

    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          choices: [{ message: { role: 'assistant', content: `\`\`\`json\n${JSON.stringify(mockJson)}\n\`\`\`` } }],
          usage: { prompt_tokens: 20, completion_tokens: 25, total_tokens: 45 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const schema = z.object({
      title: z.string(),
      duration: z.number(),
      scenes: z.number(),
    });

    const provider = new OpenRouterLLMProvider({ apiKey: testApiKey });
    const res = await provider.generateStructured(
      {
        messages: [{ role: 'user', content: 'Generate structured scene' }],
      },
      schema
    );

    assert.deepEqual(res.parsed, mockJson);
  });

  it('should throw ProviderAuthenticationError on HTTP 401 and never leak API key in error message', async () => {
    global.fetch = async () => {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid API Key provided', code: 401 } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const provider = new OpenRouterLLMProvider({ apiKey: testApiKey });

    await assert.rejects(
      async () => {
        await provider.complete({ messages: [{ role: 'user', content: 'test' }] });
      },
      (err) => {
        assert.ok(err instanceof ProviderAuthenticationError);
        assert.equal(err.statusCode, 401);
        // Ensure secret key is NEVER leaked in error message or representation
        assert.equal(err.message.includes(testApiKey), false);
        return true;
      }
    );
  });

  it('should throw ProviderRateLimitError on HTTP 429', async () => {
    global.fetch = async () => {
      return new Response(
        JSON.stringify({ error: { message: 'Rate limit exceeded' } }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const provider = new OpenRouterLLMProvider({ apiKey: testApiKey });

    await assert.rejects(
      async () => {
        await provider.complete({ messages: [{ role: 'user', content: 'test' }] });
      },
      (err) => err instanceof ProviderRateLimitError && err.statusCode === 429
    );
  });

  it('should throw ProviderUnavailableError on HTTP 503', async () => {
    global.fetch = async () => {
      return new Response('Upstream server timeout', { status: 503 });
    };

    const provider = new OpenRouterLLMProvider({ apiKey: testApiKey });

    await assert.rejects(
      async () => {
        await provider.complete({ messages: [{ role: 'user', content: 'test' }] });
      },
      (err) => err instanceof ProviderUnavailableError && err.statusCode === 503
    );
  });

  it('should throw ProviderTimeoutError when request aborts due to timeout', async () => {
    global.fetch = async (url, options) => {
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    };

    const provider = new OpenRouterLLMProvider({ apiKey: testApiKey, timeoutMs: 10 });

    await assert.rejects(
      async () => {
        await provider.complete({ messages: [{ role: 'user', content: 'timeout test' }] });
      },
      (err) => err instanceof ProviderTimeoutError && err.statusCode === 504
    );
  });

  it('should throw ProviderResponseError when LLM returns invalid JSON for structured request', async () => {
    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          choices: [{ message: { role: 'assistant', content: 'I cannot provide JSON format.' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const schema = z.object({ target: z.string() });
    const provider = new OpenRouterLLMProvider({ apiKey: testApiKey });

    await assert.rejects(
      async () => {
        await provider.generateStructured({ messages: [{ role: 'user', content: 'test' }] }, schema);
      },
      (err) => err instanceof ProviderResponseError
    );
  });
});
