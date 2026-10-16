import 'reflect-metadata';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Pool } from 'pg';
import { INestApplication } from '@nestjs/common';
import { createApplication } from '../src/app';
import { Database } from '../src/database';

const connectionString = process.env.DATABASE_URL;
assert.ok(connectionString, 'DATABASE_URL is required for integration tests');
const databaseUrl = new URL(connectionString);
assert.ok(['127.0.0.1', 'localhost', 'db'].includes(databaseUrl.hostname), 'Integration tests require a local database');
assert.ok(/apree|test/.test(databaseUrl.pathname), 'Use the dedicated local apree/test database');
const schema = `apree_test_${randomUUID().replaceAll('-', '')}`;
const isolatedUrl = new URL(connectionString);
isolatedUrl.searchParams.set('options', `-c search_path=${schema}`);
const isolatedConnectionString = isolatedUrl.toString();
const admin = new Pool({ connectionString });
let app: INestApplication | undefined;
let testPool: Pool | undefined;
let base = '';

before(async () => {
  await admin.query(`CREATE SCHEMA "${schema}"`);
  testPool = new Pool({ connectionString: isolatedConnectionString, statement_timeout: 5000 });
  const location = await testPool.query<{ schema: string }>('SELECT current_schema() AS schema');
  assert.equal(location.rows[0]?.schema, schema, 'Refusing migrations and CRUD outside the isolated schema');
  const env = { ...process.env, DATABASE_URL: isolatedConnectionString };
  execFileSync(process.execPath, ['scripts/migrate.mjs'], { env });
  execFileSync(process.execPath, ['scripts/migrate.mjs'], { env });
  app = await createApplication(testPool);
  await app.listen(0, '127.0.0.1');
  base = `${await app.getUrl()}/api`;
});

after(async () => {
  if (app) await app.close();
  else await testPool?.end();
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await admin.end();
});

async function request(path: string, method = 'GET', body?: unknown) {
  return fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function input(title = 'Проверить релиз') {
  return { id: randomUUID(), title, description: 'Описание 🚀', priority: 'high', status: 'new' };
}

test('AC-001/002/005: CRUD persists through a fresh HTTP read', async () => {
  const data = input();
  const created = await request('/tasks', 'POST', data);
  assert.equal(created.status, 201);
  const task = await created.json();
  assert.equal(task.version, 1);
  assert.equal(task.title, data.title);
  assert.equal((await request(`/tasks/${task.id}`)).status, 200);
  const moved = await request(`/tasks/${task.id}`, 'PATCH', { version: 1, status: 'in_progress', title: 'Обновлено' });
  assert.equal(moved.status, 200);
  const changed = await moved.json();
  assert.equal(changed.version, 2);
  assert.equal(changed.status, 'in_progress');
  const list = await (await request('/tasks')).json();
  assert.ok(list.items.some((item: { id: string }) => item.id === task.id));
  const fresh = await (await request(`/tasks/${task.id}`)).json();
  assert.equal(fresh.title, 'Обновлено');
  assert.equal((await request(`/tasks/${task.id}`, 'DELETE', { version: 2 })).status, 204);
  assert.equal((await request(`/tasks/${task.id}`)).status, 404);
});

test('AC-003: HTTP rejects invalid values and unknown fields', async () => {
  for (const patch of [{ title: '  ' }, { title: 'a'.repeat(161) }, { description: 'x'.repeat(5001) }, { status: 'other' }, { priority: null }, { arbitrary: true }, { id: 'invalid' }]) {
    assert.equal((await request('/tasks', 'POST', { ...input(), ...patch })).status, 400);
  }
  assert.equal((await request('/tasks/wrong')).status, 400);
  assert.equal((await request(`/tasks/${randomUUID()}`, 'PATCH', { version: 1 })).status, 400);
  assert.equal((await request(`/tasks/${randomUUID()}`, 'DELETE', { version: '1' })).status, 400);
});

test('AC-004: concurrent changes and stale deletion cannot overwrite data', async () => {
  const data = input();
  assert.equal((await request('/tasks', 'POST', data)).status, 201);
  const responses = await Promise.all([
    request(`/tasks/${data.id}`, 'PATCH', { version: 1, status: 'done' }),
    request(`/tasks/${data.id}`, 'PATCH', { version: 1, title: 'Вторая вкладка' }),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await request(`/tasks/${data.id}`, 'DELETE', { version: 1 })).status, 409);
  const current = await (await request(`/tasks/${data.id}`)).json();
  assert.equal(current.version, 2);
  assert.equal((await request(`/tasks/${data.id}`, 'DELETE', { version: 2 })).status, 204);
});

test('duplicate create returns conflict, SQL-looking text is stored as text', async () => {
  const data = input("'; DROP TABLE tasks; --");
  assert.equal((await request('/tasks', 'POST', data)).status, 201);
  assert.equal((await request('/tasks', 'POST', data)).status, 409);
  const fetched = await (await request(`/tasks/${data.id}`)).json();
  assert.equal(fetched.title, data.title);
  assert.equal((await request('/tasks')).status, 200);
  await request(`/tasks/${data.id}`, 'DELETE', { version: 1 });
});

test('missing records return 404 and readiness checks PostgreSQL', async () => {
  const id = randomUUID();
  assert.equal((await request(`/tasks/${id}`)).status, 404);
  assert.equal((await request(`/tasks/${id}`, 'PATCH', { version: 1, title: 'Нет' })).status, 404);
  assert.equal((await request(`/tasks/${id}`, 'DELETE', { version: 1 })).status, 404);
  assert.equal((await request('/health')).status, 200);
});

test('NUL in POST and PATCH returns 400 without changing the task', async () => {
  for (const field of ['title', 'description']) {
    assert.equal((await request('/tasks', 'POST', { ...input(), [field]: 'a\u0000b' })).status, 400);
  }
  const data = input();
  assert.equal((await request('/tasks', 'POST', data)).status, 201);
  for (const field of ['title', 'description']) {
    assert.equal((await request(`/tasks/${data.id}`, 'PATCH', { version: 1, [field]: 'a\u0000b' })).status, 400);
  }
  const unchanged = await (await request(`/tasks/${data.id}`)).json();
  assert.equal(unchanged.version, 1);
  assert.equal(unchanged.title, data.title);
  await request(`/tasks/${data.id}`, 'DELETE', { version: 1 });
});

test('oversized HTTP body is a client error, not a server failure', async () => {
  const result = await request('/tasks', 'POST', { ...input(), description: 'x'.repeat(40000) });
  assert.equal(result.status, 413);
  assert.equal((await result.json()).statusCode, 413);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('URL options cannot redirect tests or migrations into another schema', async () => {
  const pool = app!.get(Database).pool;
  const location = await pool.query<{ schema: string }>('SELECT current_schema() AS schema');
  assert.equal(location.rows[0]?.schema, schema);
  const ledger = await pool.query('SELECT count(*)::int AS count FROM schema_migrations');
  assert.equal(ledger.rows[0].count, 1);
  const tasks = await pool.query('SELECT table_schema FROM information_schema.tables WHERE table_name = $1 AND table_schema = current_schema()', ['tasks']);
  assert.equal(tasks.rows[0]?.table_schema, schema);
});
