import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppServer } from '../../src/server/app-server.js';

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const app = createAppServer({ databasePath: ':memory:' });
  await app.listen(0, '127.0.0.1');
  const address = app.server.address();
  assert(address && typeof address === 'object');
  try { await run(`http://127.0.0.1:${address.port}`); } finally { await app.close(); }
}

async function json(response: Response): Promise<{ data?: unknown; code?: string }> {
  return response.json() as Promise<{ data?: unknown; code?: string }>;
}

test('lista recursos e cria reserva pelo contrato HTTP', async () => withServer(async (url) => {
  const resources = await fetch(`${url}/api/resources`);
  assert.equal(resources.status, 200);
  assert.equal((await json(resources)).data instanceof Array, true);

  const created = await fetch(`${url}/api/reservations`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      resourceId: 'lab-chemistry', startAt: '2026-09-16T10:00:00Z', endAt: '2026-09-16T11:00:00Z',
    }),
  });
  assert.equal(created.status, 201);
  assert.equal((await json(created)).data instanceof Object, true);
}));

test('lista, cancela e mostra histórico com erros estruturados', async () => withServer(async (url) => {
  const created = await fetch(`${url}/api/reservations`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ resourceId: 'lab-chemistry', startAt: '2026-09-18T10:00:00Z', endAt: '2026-09-18T11:00:00Z' }),
  });
  const reservation = (await json(created)).data as { id: string };

  const listed = await fetch(`${url}/api/reservations?resourceId=lab-chemistry&status=CONFIRMED`);
  assert.equal(listed.status, 200);
  assert.equal(((await json(listed)).data as unknown[]).length, 1);

  assert.equal((await fetch(`${url}/api/reservations/${reservation.id}/cancel`, { method: 'POST' })).status, 200);
  const history = await fetch(`${url}/api/reservations/${reservation.id}/history`);
  assert.equal(history.status, 200);
  assert.equal(((await json(history)).data as unknown[]).length, 2);

  const invalid = await fetch(`${url}/api/reservations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
  assert.equal(invalid.status, 400);
  assert.equal((await json(invalid)).code, 'VALIDATION_ERROR');
}));
