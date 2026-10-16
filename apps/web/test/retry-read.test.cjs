const { test } = require('node:test');
const assert = require('node:assert/strict');
const { retryRead } = require('../src/lib/retry-read.ts');

test('read waits for a sleeping service and returns its first successful response', async () => {
  let attempts = 0;
  const result = await retryRead(async () => {
    attempts++;
    if (attempts < 3) throw new Error('sleeping');
    return { items: ['persisted task'] };
  }, new AbortController().signal, () => true, { delayMs: 1, timeoutMs: 1000 });
  assert.equal(attempts, 3);
  assert.deepEqual(result, { items: ['persisted task'] });
});

test('a permanent failure is returned without another request', async () => {
  let attempts = 0;
  const failure = new Error('invalid response contract');
  await assert.rejects(retryRead(async () => {
    attempts++;
    throw failure;
  }, new AbortController().signal, () => false), (error) => error === failure);
  assert.equal(attempts, 1);
});

test('cancellation during backoff stops further reads', async () => {
  const controller = new AbortController();
  let attempts = 0;
  const result = retryRead(async () => {
    attempts++;
    throw new Error('sleeping');
  }, controller.signal, () => true, { delayMs: 1000 });
  const timer = setTimeout(() => controller.abort(), 10);
  try { await assert.rejects(result, { name: 'AbortError' }); }
  finally { clearTimeout(timer); }
  assert.equal(attempts, 1);
});

test('the total wakeup budget ends retries during backoff', async () => {
  let attempts = 0;
  await assert.rejects(retryRead(async () => {
    attempts++;
    throw new Error('sleeping');
  }, new AbortController().signal, () => true, { delayMs: 100, timeoutMs: 20 }), { name: 'TimeoutError' });
  assert.equal(attempts, 1);
});

test('an already cancelled read does not contact the server', async () => {
  const controller = new AbortController();
  controller.abort();
  let attempts = 0;
  await assert.rejects(retryRead(async () => { attempts++; }, controller.signal, () => true), { name: 'AbortError' });
  assert.equal(attempts, 0);
});
