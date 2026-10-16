const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStatusMoves } = require('../src/lib/status-moves.ts');

const task = { id: 'one', title: 'Task', description: '', priority: 'medium', status: 'new', version: 1, createdAt: '2026-10-16T00:00:00.000Z', updatedAt: '2026-10-16T00:00:00.000Z' };
const tick = () => new Promise(setImmediate);
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function setup(save) {
  const events = { views: [], saved: [], completed: [], errors: [], rollbacks: [], idle: 0, started: 0 };
  const moves = createStatusMoves({ save, onStart: () => events.started++, onChange: (view) => events.views.push(view), onSaved: (value) => events.saved.push(value), onComplete: (value) => events.completed.push(value), onError: (error, task) => { events.errors.push(error); events.rollbacks.push(task); }, onIdle: () => events.idle++ });
  return { moves, events };
}

test('status changes immediately while the response is still pending', async () => {
  const request = deferred();
  const { moves, events } = setup(() => request.promise);
  moves.move(task, 'in_progress');
  assert.equal(events.views.at(-1).get(task.id), 'in_progress');
  assert.equal(moves.isPending(task.id), true);
  assert.equal(events.completed.length, 0);
  request.resolve({ ...task, status: 'in_progress', version: 2 });
  await tick();
  assert.equal(events.saved[0].version, 2);
  assert.equal(events.views.at(-1).size, 0);
  assert.equal(moves.isPending(task.id), false);
  assert.equal(events.completed[0].status, 'in_progress');
  assert.equal(events.idle, 1);
});

test('rapid moves use the latest intent and the acknowledged server version', async () => {
  const requests = [deferred(), deferred()];
  const calls = [];
  const { moves, events } = setup((value, status) => { calls.push({ value, status }); return requests[calls.length - 1].promise; });
  moves.move(task, 'in_progress');
  moves.move({ ...task, status: 'in_progress' }, 'done');
  moves.move({ ...task, status: 'done' }, 'new');
  assert.equal(calls.length, 1);
  assert.equal(events.views.at(-1).get(task.id), 'new');
  requests[0].resolve({ ...task, status: 'in_progress', version: 2 });
  await tick();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].value.version, 2);
  assert.equal(calls[1].status, 'new');
  assert.equal(events.completed.length, 0);
  assert.equal(events.views.at(-1).get(task.id), 'new');
  requests[1].resolve({ ...task, status: 'new', version: 3 });
  await tick();
  assert.equal(events.completed.length, 1);
  assert.equal(events.completed[0].version, 3);
  assert.equal(events.started, 1);
});

test('separate tasks save independently and become idle only after both settle', async () => {
  const first = deferred(), second = deferred();
  const { moves, events } = setup((value) => value.id === 'one' ? first.promise : second.promise);
  moves.move(task, 'done');
  moves.move({ ...task, id: 'two' }, 'in_progress');
  assert.equal(events.views.at(-1).size, 2);
  first.resolve({ ...task, status: 'done', version: 2 });
  await tick();
  assert.equal(events.idle, 0);
  assert.equal(moves.isPending('two'), true);
  second.resolve({ ...task, id: 'two', status: 'in_progress', version: 2 });
  await tick();
  assert.equal(events.idle, 1);
  assert.equal(events.views.at(-1).size, 0);
});

test('a failed write removes the optimistic status without retrying', async () => {
  const request = deferred();
  let calls = 0;
  const { moves, events } = setup(() => { calls++; return request.promise; });
  moves.move(task, 'done');
  const failure = new Error('503');
  request.reject(failure);
  await tick();
  assert.equal(calls, 1);
  assert.equal(events.errors[0], failure);
  assert.equal(events.saved.length, 0);
  assert.equal(events.completed.length, 0);
  assert.equal(events.views.at(-1).size, 0);
  assert.equal(events.rollbacks[0].status, 'new');
  assert.equal(events.idle, 1);
});

test('failure of a queued move retains the last acknowledged result', async () => {
  const requests = [deferred(), deferred()];
  let calls = 0;
  const { moves, events } = setup(() => requests[calls++].promise);
  moves.move(task, 'in_progress');
  moves.move(task, 'done');
  requests[0].resolve({ ...task, status: 'in_progress', version: 2 });
  await tick();
  requests[1].reject(new Error('409'));
  await tick();
  assert.equal(events.saved.at(-1).status, 'in_progress');
  assert.equal(events.saved.at(-1).version, 2);
  assert.equal(events.completed.length, 0);
  assert.equal(events.errors.length, 1);
  assert.equal(events.rollbacks[0].status, 'in_progress');
  assert.equal(events.rollbacks[0].version, 2);
  assert.equal(events.views.at(-1).size, 0);
});

test('a no-op move does not write or announce success', () => {
  const { moves, events } = setup(() => { throw new Error('unexpected write'); });
  moves.move(task, 'new');
  assert.equal(events.started, 0);
  assert.equal(events.views.length, 0);
  assert.equal(events.completed.length, 0);
});

test('returning to the in-flight target needs no duplicate write', async () => {
  const request = deferred();
  let calls = 0;
  const { moves, events } = setup(() => { calls++; return request.promise; });
  moves.move(task, 'in_progress');
  moves.move(task, 'done');
  moves.move(task, 'in_progress');
  request.resolve({ ...task, status: 'in_progress', version: 2 });
  await tick();
  assert.equal(calls, 1);
  assert.equal(events.completed[0].status, 'in_progress');
});
