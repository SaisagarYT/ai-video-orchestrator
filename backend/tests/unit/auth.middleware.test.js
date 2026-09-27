import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth } from '../../src/middleware/auth.middleware.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Auth Middleware Unit Tests', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('should reject request when Authorization header is missing', async () => {
    const req = { headers: {} };
    let capturedError = null;
    const next = (err) => {
      capturedError = err;
    };

    await requireAuth(req, {}, next);

    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 401);
    assert.equal(capturedError.code, 'UNAUTHORIZED');
  });

  it('should reject request when Authorization header does not use Bearer scheme', async () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    let capturedError = null;
    const next = (err) => {
      capturedError = err;
    };

    await requireAuth(req, {}, next);

    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 401);
  });

  it('should reject invalid authentication token', async () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    let capturedError = null;
    const next = (err) => {
      capturedError = err;
    };

    await requireAuth(req, {}, next);

    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 401);
  });

  it('should accept valid Bearer token and attach user to req', async () => {
    const req = { headers: { authorization: 'Bearer test-token:usr-uuid-1:alice@example.com' } };
    let calledNext = false;
    const next = (err) => {
      assert.ifError(err);
      calledNext = true;
    };

    await requireAuth(req, {}, next);

    assert.equal(calledNext, true);
    assert.ok(req.user);
    assert.equal(req.user.id, 'usr-uuid-1');
    assert.equal(req.user.email, 'alice@example.com');

    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'usr-uuid-1')
      .single();

    assert.ok(dbUser);
    assert.equal(dbUser.id, 'usr-uuid-1');
    assert.equal(dbUser.email, 'alice@example.com');
  });

  it('should accept token from query parameter for SSE EventSource compatibility', async () => {
    const req = {
      headers: {},
      query: { token: 'test-token:usr-uuid-2:bob@example.com' },
    };
    let calledNext = false;
    const next = (err) => {
      assert.ifError(err);
      calledNext = true;
    };

    await requireAuth(req, {}, next);

    assert.equal(calledNext, true);
    assert.ok(req.user);
    assert.equal(req.user.id, 'usr-uuid-2');
    assert.equal(req.user.email, 'bob@example.com');
  });
});
