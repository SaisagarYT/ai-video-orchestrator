import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';

import app from '../../src/app.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Brand & Creative Memory API Integration Tests', () => {
  let server;
  let baseUrl;

  const userAId = 'user-a';
  const userBId = 'user-b';
  const userAToken = `Bearer test-token:${userAId}:usera@example.com`;
  const userBToken = `Bearer test-token:${userBId}:userb@example.com`;

  let businessAId;
  let businessBId;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(async () => {
    memoryDb.reset();

    businessAId = crypto.randomUUID();
    businessBId = crypto.randomUUID();

    await supabase.from('users').insert([
      { id: userAId, email: 'usera@example.com', role: 'creator' },
      { id: userBId, email: 'userb@example.com', role: 'creator' },
    ]);

    await supabase.from('businesses').insert([
      { id: businessAId, user_id: userAId, name: 'Brand Alpha', brand_colors: '#111111, #222222' },
      { id: businessBId, user_id: userBId, name: 'Brand Beta', brand_colors: '#333333, #444444' },
    ]);
  });

  it('should create a brand memory item for authenticated business owner (201 Created)', async () => {
    const res = await fetch(`${baseUrl}/api/businesses/${businessAId}/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        category: 'COLOR',
        key: 'primary_hex',
        value: '#111111',
        type: 'HARD_CONSTRAINT',
        priority: 80,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.equal(body.data.key, 'primary_hex');
    assert.equal(body.data.business_id, businessAId);
  });

  it('should prevent User B from accessing or adding memory to User A business (403 Forbidden)', async () => {
    // 1. User B tries to read User A's memory
    const getRes = await fetch(`${baseUrl}/api/businesses/${businessAId}/memory`, {
      headers: { Authorization: userBToken },
    });
    assert.equal(getRes.status, 403);

    // 2. User B tries to insert memory into User A's business
    const postRes = await fetch(`${baseUrl}/api/businesses/${businessAId}/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userBToken,
      },
      body: JSON.stringify({
        category: 'VOICE',
        key: 'hacked_tone',
        value: 'Malicious Tone',
      }),
    });
    assert.equal(postRes.status, 403);
  });

  it('should validate memory payloads with Zod (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/businesses/${businessAId}/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        category: 'INVALID_CATEGORY',
        key: 'some_key',
        value: 'some_value',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  it('should update and soft-archive brand memory items via API', async () => {
    // 1. Create item
    const createRes = await fetch(`${baseUrl}/api/businesses/${businessAId}/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        category: 'LIGHTING',
        key: 'ambient_light',
        value: 'Warm natural daylight',
      }),
    });
    assert.equal(createRes.status, 201);
    const { data: item } = await createRes.json();

    // 2. Update item
    const patchRes = await fetch(`${baseUrl}/api/businesses/${businessAId}/memory/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        value: 'High-contrast studio lighting',
        priority: 75,
      }),
    });
    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.data.value, 'High-contrast studio lighting');
    assert.equal(patchBody.data.priority, 75);

    // 3. Archive item
    const archiveRes = await fetch(`${baseUrl}/api/businesses/${businessAId}/memory/${item.id}/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({ reason: 'Replaced with new brand guidelines' }),
    });
    assert.equal(archiveRes.status, 200);
    const archiveBody = await archiveRes.json();
    assert.equal(archiveBody.data.status, 'ARCHIVED');
  });
});

