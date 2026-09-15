import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import test from 'node:test';
import { createAppServer } from '../../src/server/app-server.js';
import { SqliteLabReserveRepository } from '../../src/persistence/sqlite-lab-reserve-repository.js';

async function withServer(run: (baseUrl: string) => Promise<void>, onUnexpectedError?: (error: unknown) => void): Promise<void> {
  const app = createAppServer({
    databasePath: ':memory:',
    ...(onUnexpectedError ? { onUnexpectedError } : {}),
  });
  await app.listen(0, '127.0.0.1');
  const address = app.server.address();
  assert(address && typeof address === 'object');
  try { await run(`http://127.0.0.1:${address.port}`); } finally { await app.close(); }
}

async function json(response: Response): Promise<{ data?: unknown; code?: string; message?: string }> {
  return response.json() as Promise<{ data?: unknown; code?: string; message?: string }>;
}

async function contentLengthJson(url: string, contentLength: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const request = httpRequest({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': contentLength },
    }, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => resolve({ status: response.statusCode ?? 0, body: responseBody }));
    });
    request.on('error', reject);
    request.end();
  });
}

async function chunkedJson(url: string, chunks: readonly string[]): Promise<{ status: number; connection: string | undefined; body: string }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const request = httpRequest({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' },
    }, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => resolve({
        status: response.statusCode ?? 0,
        connection: response.headers.connection,
        body: responseBody,
      }));
    });
    request.on('error', reject);
    if (chunks.length === 0) return reject(new Error('O corpo chunked exige ao menos um chunk.'));
    let index = 0;
    const writeNext = () => {
      const chunk = chunks[index++];
      if (chunk === undefined) return;
      if (index === chunks.length) request.end(chunk);
      else if (request.write(chunk)) setImmediate(writeNext);
      else request.once('drain', writeNext);
    };
    writeNext();
  });
}

async function oversizedUpload(url: string, totalBytes: number, mode: 'content-length' | 'chunked', contentType = 'application/json'): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const headers: Record<string, string> = { 'content-type': contentType };
    if (mode === 'content-length') headers['content-length'] = String(totalBytes);
    else headers['transfer-encoding'] = 'chunked';
    const request = httpRequest({ hostname: target.hostname, port: target.port, path: target.pathname, method: 'POST', headers }, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => resolve({ status: response.statusCode ?? 0, body: responseBody }));
    });
    request.on('error', reject);
    const piece = Buffer.alloc(256 * 1024, 'x');
    let sent = 0;
    const writeNext = () => {
      while (sent < totalBytes) {
        const size = Math.min(piece.length, totalBytes - sent);
        sent += size;
        if (sent === totalBytes) return request.end(piece.subarray(0, size));
        if (!request.write(piece.subarray(0, size))) return request.once('drain', writeNext);
      }
    };
    writeNext();
  });
}

test('responde 413 legível para corpos realmente grandes sem resetar a conexão', async () => withServer(async (url) => {
  for (const totalBytes of [2 * 1_048_576, 8 * 1_048_576, 20 * 1_048_576]) {
    for (const mode of ['content-length', 'chunked'] as const) {
      const result = await oversizedUpload(`${url}/api/reservations`, totalBytes, mode);
      assert.equal(result.status, 413, `${mode} com ${totalBytes} bytes`);
      assert.equal((JSON.parse(result.body) as { code: string }).code, 'PAYLOAD_TOO_LARGE');
    }
  }
  const wrongType = await oversizedUpload(`${url}/api/reservations`, 8 * 1_048_576, 'chunked', 'text/plain');
  assert.equal(wrongType.status, 400);
  assert.equal((JSON.parse(wrongType.body) as { code: string }).code, 'VALIDATION_ERROR');
}));

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
  const repeatedCancellation = await fetch(`${url}/api/reservations/${reservation.id}/cancel`, { method: 'POST' });
  assert.equal(repeatedCancellation.status, 409);
  assert.equal((await json(repeatedCancellation)).code, 'RESERVATION_ALREADY_CANCELLED');
  const history = await fetch(`${url}/api/reservations/${reservation.id}/history`);
  assert.equal(history.status, 200);
  assert.equal(((await json(history)).data as unknown[]).length, 2);

  const invalid = await fetch(`${url}/api/reservations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
  assert.equal(invalid.status, 400);
  assert.equal((await json(invalid)).code, 'VALIDATION_ERROR');
}));

test('responde 404 para o histórico de uma reserva inexistente', async () => withServer(async (url) => {
  const history = await fetch(`${url}/api/reservations/inexistente/history`);
  assert.equal(history.status, 404);
  assert.equal((await json(history)).code, 'RESERVATION_NOT_FOUND');
}));

test('protege respostas e rejeita corpos que não sejam JSON', async () => withServer(async (url) => {
  const resources = await fetch(`${url}/api/resources`);
  assert.equal(resources.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(resources.headers.get('x-frame-options'), 'DENY');
  assert.equal(resources.headers.get('content-security-policy'), "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");

  const created = await fetch(`${url}/api/reservations`, {
    method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}',
  });
  assert.equal(created.status, 400);
  assert.equal((await json(created)).code, 'VALIDATION_ERROR');

  const jsonp = await fetch(`${url}/api/reservations`, {
    method: 'POST', headers: { 'content-type': 'application/jsonp' }, body: '{}',
  });
  assert.equal(jsonp.status, 400);
  assert.equal((await json(jsonp)).message, 'Content-Type deve ser application/json.');

  const limit = await fetch(`${url}/api/reservations`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: `"${'x'.repeat(1_048_574)}"`,
  });
  assert.equal(limit.status, 400);
  assert.equal((await json(limit)).message, 'Dados da reserva inválidos.');

  const oversized = await fetch(`${url}/api/reservations`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: `"${'x'.repeat(1_048_575)}"`,
  });
  assert.equal(oversized.status, 413);
  assert.equal((await json(oversized)).message, 'Corpo da requisição excede o limite permitido.');

  const chunkedBody = `"${'x'.repeat(1_048_575)}"`;
  const chunked = await chunkedJson(`${url}/api/reservations`, [
    chunkedBody.slice(0, 300_000),
    chunkedBody.slice(300_000, 600_000),
    chunkedBody.slice(600_000, 900_000),
    chunkedBody.slice(900_000),
  ]);
  assert.equal(chunked.status, 413);
  assert.equal(chunked.connection, 'close');
  assert.deepEqual(JSON.parse(chunked.body), {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Corpo da requisição excede o limite permitido.',
  });

  const impossibleContentLength = await contentLengthJson(`${url}/api/reservations`, '9007199254740992');
  assert.equal(impossibleContentLength.status, 413);
  assert.deepEqual(JSON.parse(impossibleContentLength.body), {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Corpo da requisição excede o limite permitido.',
  });

  const invalidDate = await fetch(`${url}/api/reservations`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ resourceId: 'lab-chemistry', startAt: '2026-02-29T10:00:00Z', endAt: '2026-02-29T11:00:00Z' }),
  });
  assert.equal(invalidDate.status, 400);
  assert.equal((await json(invalidDate)).code, 'INVALID_TIME_RANGE');
}));

test('registra falhas inesperadas sem expor seus detalhes', async () => {
  const original = SqliteLabReserveRepository.prototype.listResources;
  const logged: unknown[] = [];
  SqliteLabReserveRepository.prototype.listResources = () => { throw new Error('falha de banco simulada'); };
  try {
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/resources`);
      assert.equal(response.status, 500);
      assert.deepEqual(await json(response), { code: 'INTERNAL_ERROR', message: 'Erro interno.' });
    }, (error) => logged.push(error));
  } finally {
    SqliteLabReserveRepository.prototype.listResources = original;
  }
  assert.equal(logged.length, 1);
  assert.equal(logged[0] instanceof Error && logged[0].message, 'falha de banco simulada');
});

test('mantém a resposta interna segura quando o logger falha', async () => {
  const original = SqliteLabReserveRepository.prototype.listResources;
  SqliteLabReserveRepository.prototype.listResources = () => { throw new Error('falha de banco simulada'); };
  try {
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/resources`);
      assert.equal(response.status, 500);
      assert.deepEqual(await json(response), { code: 'INTERNAL_ERROR', message: 'Erro interno.' });
    }, () => { throw new Error('falha do logger simulada'); });
  } finally {
    SqliteLabReserveRepository.prototype.listResources = original;
  }
});

test('informa disponibilidade, histórico global e erros de domínio pelo contrato', async () => withServer(async (url) => {
  const interval = 'startAt=2026-09-19T10%3A00%3A00Z&endAt=2026-09-19T11%3A00%3A00Z';
  const available = await fetch(`${url}/api/resources?${interval}`);
  assert.equal(((await json(available)).data as Array<{ available: boolean }>)[0]?.available, true);

  const payload = JSON.stringify({ resourceId: 'lab-chemistry', startAt: '2026-09-19T10:00:00Z', endAt: '2026-09-19T11:00:00Z' });
  await fetch(`${url}/api/reservations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload });
  const conflict = await fetch(`${url}/api/reservations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload });
  assert.equal(conflict.status, 409);
  assert.equal((await json(conflict)).code, 'RESERVATION_CONFLICT');

  const history = await fetch(`${url}/api/history`);
  assert.equal(history.status, 200);
  assert.equal(((await json(history)).data as unknown[]).length, 1);
}));
