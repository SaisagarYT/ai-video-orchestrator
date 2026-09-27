import { LLMProvider } from './llm.provider.js';
import {
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderBadRequestError,
  ProviderUnavailableError,
  ProviderResponseError,
  ProviderError,
} from '../core/provider.errors.js';
import { logger } from '../../core/logger/logger.js';

export class OpenRouterLLMProvider extends LLMProvider {
  /**
   * @param {Object} options
   * @param {string} [options.apiKey]
   * @param {string} [options.baseUrl]
   * @param {string} [options.defaultModel]
   * @param {number} [options.timeoutMs]
   */
  constructor(options = {}) {
    super('openrouter', options);
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseUrl = (options.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
    this.defaultModel = options.defaultModel || process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';
    this.timeoutMs = options.timeoutMs || parseInt(process.env.AI_TIMEOUT_MS || '60000', 10);
  }

  _parseJSONContent(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
      throw new ProviderResponseError('Empty or non-string response content received from LLM');
    }

    const trimmed = rawContent.trim();

    try {
      return JSON.parse(trimmed);
    } catch (_) {}

    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (_) {}
    }

    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch && jsonMatch[0]) {
      try {
        return JSON.parse(jsonMatch[0].trim());
      } catch (err) {
        throw new ProviderResponseError(`Failed to parse extracted JSON from LLM output: ${err.message}`, {
          provider: 'openrouter',
          sample: trimmed.slice(0, 200),
        });
      }
    }

    throw new ProviderResponseError('No valid JSON structure found in LLM response', {
      provider: 'openrouter',
      sample: trimmed.slice(0, 200),
    });
  }

  async complete(request) {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError('OpenRouter API key is missing. Set OPENROUTER_API_KEY environment variable.');
    }

    const startTime = Date.now();
    const timeout = request.timeoutMs || this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const model = request.model || this.defaultModel;
    const payload = {
      model,
      messages: request.messages || [],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      response_format: request.responseFormat,
    };

    logger.debug(`[OpenRouter] Dispatching completion request to model: ${model}`);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://ai-video-orchestrator.local',
          'X-Title': 'AI Video Orchestrator',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorData = null;
        try {
          errorData = JSON.parse(errorText);
        } catch (_) {}

        const errorMessage = errorData?.error?.message || errorText || `HTTP ${response.status} ${response.statusText}`;

        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthenticationError(`OpenRouter authentication error: ${errorMessage}`, {
            provider: 'openrouter',
            statusCode: response.status,
          });
        }
        if (response.status === 429) {
          throw new ProviderRateLimitError(`OpenRouter rate limit exceeded: ${errorMessage}`, {
            provider: 'openrouter',
            statusCode: 429,
          });
        }
        if (response.status === 400) {
          throw new ProviderBadRequestError(`OpenRouter bad request: ${errorMessage}`, {
            provider: 'openrouter',
            statusCode: 400,
          });
        }
        if (response.status >= 500) {
          throw new ProviderUnavailableError(`OpenRouter upstream error: ${errorMessage}`, {
            provider: 'openrouter',
            statusCode: response.status,
          });
        }

        throw new ProviderError(`OpenRouter request failed: ${errorMessage}`, response.status, 'PROVIDER_ERROR', {
          provider: 'openrouter',
          statusCode: response.status,
        });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice || !choice.message) {
        throw new ProviderResponseError('OpenRouter response contains no valid completion choices', {
          provider: 'openrouter',
          data,
        });
      }

      const latencyMs = Date.now() - startTime;
      return {
        content: choice.message.content || '',
        model: data.model || model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        latencyMs,
      };
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
        throw new ProviderTimeoutError(`OpenRouter request timed out after ${timeout}ms`, {
          provider: 'openrouter',
          timeoutMs: timeout,
        });
      }

      if (err instanceof ProviderError) {
        throw err;
      }

      throw new ProviderError(`Unexpected OpenRouter error: ${err.message}`, 500, 'PROVIDER_ERROR', {
        provider: 'openrouter',
        cause: err.message,
      });
    }
  }

  async generateStructured(request, schema) {
    const augmentedMessages = [...(request.messages || [])];
    const systemDirective = {
      role: 'system',
      content:
        'IMPORTANT: You MUST respond ONLY with a valid JSON object matching the requested schema. Do not enclose in markdown explanation or conversational filler.',
    };

    if (augmentedMessages.length === 0 || augmentedMessages[0].role !== 'system') {
      augmentedMessages.unshift(systemDirective);
    } else {
      augmentedMessages[0] = {
        role: 'system',
        content: `${augmentedMessages[0].content}\n\n${systemDirective.content}`,
      };
    }

    const response = await this.complete({
      ...request,
      messages: augmentedMessages,
      responseFormat: { type: 'json_object' },
    });

    const parsedJson = this._parseJSONContent(response.content);

    let validatedData = parsedJson;
    if (schema) {
      const parseResult = schema.safeParse(parsedJson);
      if (!parseResult.success) {
        throw new ProviderResponseError('Structured LLM output failed schema validation', {
          provider: 'openrouter',
          errors: parseResult.error.format(),
          rawContent: response.content,
        });
      }
      validatedData = parseResult.data;
    }

    return {
      ...response,
      parsed: validatedData,
    };
  }
}

export default OpenRouterLLMProvider;
