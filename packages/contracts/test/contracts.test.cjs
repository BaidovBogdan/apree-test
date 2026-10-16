const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTaskSchema } = require('../dist/index.js');

const valid = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Подготовить релиз',
  description: '',
  priority: 'medium',
  status: 'new',
};

test('AC-003: whitespace titles are rejected', () => {
  assert.equal(createTaskSchema.safeParse({ ...valid, title: '   \n ' }).success, false);
});

test('AC-003: unknown fields, invalid enums and null are rejected', () => {
  for (const change of [{ extra: true }, { status: 'lost' }, { priority: 'urgent' }, { title: null }, { id: 'wrong' }]) {
    assert.equal(createTaskSchema.safeParse({ ...valid, ...change }).success, false);
  }
});

test('AC-003: title and description limits are enforced', () => {
  assert.equal(createTaskSchema.safeParse({ ...valid, title: 'a'.repeat(160), description: 'a'.repeat(5000) }).success, true);
  assert.equal(createTaskSchema.safeParse({ ...valid, title: 'a'.repeat(161) }).success, false);
  assert.equal(createTaskSchema.safeParse({ ...valid, description: 'a'.repeat(5001) }).success, false);
});

test('title is trimmed without removing Unicode content', () => {
  assert.equal(createTaskSchema.parse({ ...valid, title: '  Релиз 🚀  ' }).title, 'Релиз 🚀');
});

test('PostgreSQL-incompatible NUL is rejected in both text fields', () => {
  assert.equal(createTaskSchema.safeParse({ ...valid, title: 'a\u0000b' }).success, false);
  assert.equal(createTaskSchema.safeParse({ ...valid, description: 'a\u0000b' }).success, false);
});
