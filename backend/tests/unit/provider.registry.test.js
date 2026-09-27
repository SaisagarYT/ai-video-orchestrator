import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderRegistry } from '../../src/providers/core/provider.registry.js';
import { ProviderError } from '../../src/providers/core/provider.errors.js';
import { MockLLMProvider } from '../../src/providers/llm/mock-llm.provider.js';
import { MockImageProvider } from '../../src/providers/image/mock-image.provider.js';

describe('Provider Registry Unit Tests', () => {
  let registry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  it('should register and retrieve a provider by type and name', () => {
    const mockLLM = new MockLLMProvider();
    registry.register('llm', 'mock', mockLLM, { isDefault: true });

    assert.equal(registry.has('llm', 'mock'), true);
    assert.equal(registry.get('llm', 'mock'), mockLLM);
    assert.equal(registry.getLLM('mock'), mockLLM);
    assert.equal(registry.getLLM(), mockLLM);
  });

  it('should reject invalid provider types and null instances', () => {
    assert.throws(
      () => registry.register('quantum_compute', 'mock', {}),
      (err) => err instanceof ProviderError && err.message.includes('Invalid provider type')
    );

    assert.throws(
      () => registry.register('llm', 'null_provider', null),
      (err) => err instanceof ProviderError && err.message.includes('Cannot register null')
    );
  });

  it('should throw ProviderError when requesting an unregistered provider or type', () => {
    assert.throws(
      () => registry.get('llm', 'non_existent'),
      (err) => err instanceof ProviderError && err.message.includes('not found')
    );

    assert.throws(
      () => registry.get('llm'),
      (err) => err instanceof ProviderError && err.message.includes('No default provider configured')
    );
  });

  it('should allow changing the default provider for a type', () => {
    const mock1 = new MockLLMProvider();
    const mock2 = new MockLLMProvider();

    registry.register('llm', 'provider1', mock1, { isDefault: true });
    registry.register('llm', 'provider2', mock2);

    assert.equal(registry.getLLM(), mock1);

    registry.setDefault('llm', 'provider2');
    assert.equal(registry.getLLM(), mock2);
  });

  it('should list all registered providers by category', () => {
    registry.register('llm', 'mock-llm', new MockLLMProvider(), { isDefault: true });
    registry.register('image', 'mock-img', new MockImageProvider(), { isDefault: true });

    const summary = registry.list();
    assert.deepEqual(summary.llm.providers, ['mock-llm']);
    assert.equal(summary.llm.default, 'mock-llm');
    assert.deepEqual(summary.image.providers, ['mock-img']);
    assert.equal(summary.image.default, 'mock-img');
    assert.deepEqual(registry.list('llm'), ['mock-llm']);
  });
});
