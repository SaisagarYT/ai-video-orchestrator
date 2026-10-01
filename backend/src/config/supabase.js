import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';
import { logger } from '../core/logger/logger.js';
import crypto from 'node:crypto';

/**
 * In-Memory Mock Database Store for Unit & Integration Testing
 * Emulates the Supabase JavaScript Client query builder syntax.
 */
class MemoryDatabaseStore {
  constructor() {
    this.tables = {
      users: new Map(),
      businesses: new Map(),
      campaigns: new Map(),
      scenes: new Map(),
      workflow_executions: new Map(),
      workflow_steps: new Map(),
      workflow_events: new Map(),
      provider_jobs: new Map(),
      assets: new Map(),
      timelines: new Map(),
      render_jobs: new Map(),
      final_videos: new Map(),
      quality_evaluations: new Map(),
      revision_attempts: new Map(),
      revision_targets: new Map(),
      video_understanding_runs: new Map(),
      video_understanding_scenes: new Map(),
    };
  }

  reset() {
    for (const key of Object.keys(this.tables)) {
      this.tables[key].clear();
    }
  }

  getTable(name) {
    if (!this.tables[name]) {
      this.tables[name] = new Map();
    }
    return this.tables[name];
  }
}

export const memoryDb = new MemoryDatabaseStore();

/**
 * Memory Query Builder that mimics Supabase Query Builder
 */
class MemoryQueryBuilder {
  constructor(tableName, store) {
    this.tableName = tableName;
    this.store = store;
    this.operation = 'select';
    this.selectCols = '*';
    this.filters = [];
    this.orderClause = null;
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.insertPayload = null;
    this.updatePayload = null;
    this.isUpsert = false;
    this.isDelete = false;
  }

  select(columns = '*') {
    if (this.operation !== 'insert' && this.operation !== 'upsert' && this.operation !== 'update') {
      this.operation = 'select';
    }
    this.selectCols = columns;
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.insertPayload = payload;
    return this;
  }

  upsert(payload) {
    this.operation = 'upsert';
    this.insertPayload = payload;
    this.isUpsert = true;
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.updatePayload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    this.isDelete = true;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column, values) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderClause = { column, ascending };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.then();
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.then();
  }

  async then(resolve, reject) {
    try {
      const table = this.store.getTable(this.tableName);

      if (this.operation === 'insert' || this.operation === 'upsert') {
        const items = Array.isArray(this.insertPayload) ? this.insertPayload : [this.insertPayload];
        const inserted = [];

        for (const item of items) {
          const id = item.id || crypto.randomUUID();
          const now = new Date().toISOString();
          const row = {
            ...item,
            id,
            created_at: item.created_at || now,
            updated_at: item.updated_at || now,
          };

          // Unique constraint checks
          if (this.tableName === 'users' && !this.isUpsert) {
            for (const existing of table.values()) {
              if (existing.email === row.email && existing.id !== row.id) {
                const res = { data: null, error: { message: 'Unique constraint failed on users.email', code: '23505' } };
                return resolve ? resolve(res) : res;
              }
            }
          }

          if (this.tableName === 'workflow_executions' && row.idempotency_key) {
            for (const existing of table.values()) {
              if (
                existing.user_id === row.user_id &&
                existing.idempotency_key === row.idempotency_key &&
                existing.id !== row.id
              ) {
                const res = {
                  data: null,
                  error: {
                    message: 'Unique constraint failed on (user_id, idempotency_key)',
                    code: '23505',
                  },
                };
                return resolve ? resolve(res) : res;
              }
            }
          }

          if (this.tableName === 'provider_jobs' && row.idempotency_key) {
            for (const existing of table.values()) {
              if (existing.idempotency_key === row.idempotency_key && existing.id !== row.id) {
                const res = {
                  data: null,
                  error: {
                    message: 'Unique constraint failed on provider_jobs.idempotency_key',
                    code: '23505',
                  },
                };
                return resolve ? resolve(res) : res;
              }
            }
          }

          if (this.tableName === 'render_jobs' && row.idempotency_key) {
            for (const existing of table.values()) {
              if (existing.idempotency_key === row.idempotency_key && existing.id !== row.id) {
                const res = {
                  data: null,
                  error: {
                    message: 'Unique constraint failed on render_jobs.idempotency_key',
                    code: '23505',
                  },
                };
                return resolve ? resolve(res) : res;
              }
            }
          }

          table.set(id, row);
          inserted.push(row);
        }

        const data = this.isSingle
          ? (inserted[0] || null)
          : (Array.isArray(this.insertPayload) ? inserted : inserted[0]);
        const res = { data, error: null };
        return resolve ? resolve(res) : res;
      }

      if (this.operation === 'update') {
        const rows = Array.from(table.values()).filter((row) =>
          this.filters.every((filter) => filter(row))
        );

        const updated = [];
        for (const row of rows) {
          const updatedRow = {
            ...row,
            ...this.updatePayload,
            updated_at: new Date().toISOString(),
          };
          table.set(row.id, updatedRow);
          updated.push(updatedRow);
        }

        const data = this.isSingle ? updated[0] || null : updated;
        const res = { data, error: null };
        return resolve ? resolve(res) : res;
      }

      if (this.operation === 'delete') {
        const rows = Array.from(table.values()).filter((row) =>
          this.filters.every((filter) => filter(row))
        );

        for (const row of rows) {
          table.delete(row.id);
        }

        const res = { data: rows, error: null };
        return resolve ? resolve(res) : res;
      }

      // SELECT
      let rows = Array.from(table.values()).filter((row) =>
        this.filters.every((filter) => filter(row))
      );

      if (this.orderClause) {
        const { column, ascending } = this.orderClause;
        rows.sort((a, b) => {
          if (a[column] < b[column]) return ascending ? -1 : 1;
          if (a[column] > b[column]) return ascending ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount !== null) {
        rows = rows.slice(0, this.limitCount);
      }

      if (this.isSingle) {
        if (rows.length === 0) {
          const res = { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
          return resolve ? resolve(res) : res;
        }
        const res = { data: rows[0], error: null };
        return resolve ? resolve(res) : res;
      }

      if (this.isMaybeSingle) {
        const res = { data: rows[0] || null, error: null };
        return resolve ? resolve(res) : res;
      }

      const res = { data: rows, error: null };
      return resolve ? resolve(res) : res;
    } catch (err) {
      const errRes = { data: null, error: err };
      return resolve ? resolve(errRes) : errRes;
    }
  }
}

/**
 * Mock Supabase Client
 */
class MockSupabaseClient {
  constructor(store) {
    this.store = store;
    this.auth = {
      getUser: async (token) => {
        if (!token || token === 'invalid-token') {
          return { data: { user: null }, error: { message: 'Invalid token' } };
        }
        if (token.startsWith('test-token:')) {
          const [, id, email] = token.split(':');
          return {
            data: {
              user: {
                id: id || 'test-user-id',
                email: email || 'test@example.com',
                user_metadata: { full_name: 'Test User' },
              },
            },
            error: null,
          };
        }
        return {
          data: {
            user: {
              id: 'mock-user-uuid',
              email: 'creator@example.com',
              user_metadata: { full_name: 'Mock Creator' },
            },
          },
          error: null,
        };
      },
    };
  }

  from(tableName) {
    return new MemoryQueryBuilder(tableName, this.store);
  }
}

let supabaseInstance = null;

if (config.isTest || !config.supabase.isConfigured) {
  logger.info('Using Supabase In-Memory Adapter (Test / Local Mode)');
  supabaseInstance = new MockSupabaseClient(memoryDb);
} else {
  try {
    supabaseInstance = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info('Connected to Supabase PostgreSQL via Service Role Client');
  } catch (err) {
    logger.warn('Failed to initialize live Supabase client, falling back to In-Memory Adapter', {
      error: err.message,
    });
    supabaseInstance = new MockSupabaseClient(memoryDb);
  }
}

export const supabase = supabaseInstance;
export default supabase;
