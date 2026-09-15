import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { ApplicationError } from '../application/application-error.js';
import { LabReserveService, type CreateReservationInput } from '../application/lab-reserve-service.js';
import { DomainError } from '../domain/domain-error.js';
import { SqliteLabReserveRepository } from '../persistence/sqlite-lab-reserve-repository.js';

interface AppServerOptions {
  databasePath: string;
  onUnexpectedError?: (error: unknown) => void;
}

class ValidationError extends Error {}
class PayloadTooLargeError extends Error {}

function reservationInput(value: unknown): CreateReservationInput {
  if (!value || typeof value !== 'object') throw new ValidationError('Dados da reserva inválidos.');
  const { resourceId, startAt, endAt } = value as Record<string, unknown>;
  if (typeof resourceId !== 'string' || typeof startAt !== 'string' || typeof endAt !== 'string') throw new ValidationError('Dados da reserva inválidos.');
  return { resourceId, startAt, endAt };
}

const MAX_BODY_BYTES = 1_048_576;
const MAX_DISCARD_BYTES = 64 * 1_048_576;
const MAX_DISCARD_MS = 5_000;
const MAX_CONCURRENT_DISCARDS = 8;
let activeDiscards = 0;

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  });
  response.end(JSON.stringify(body));
}

function declaredLengthExceeds(request: IncomingMessage, limit: number): boolean {
  const length = request.headers['content-length'];
  return typeof length === 'string' && /^\d+$/.test(length) && BigInt(length) > BigInt(limit);
}

function readBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const cleanUp = () => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
    };
    const onData = (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        request.pause();
        cleanUp();
        reject(new PayloadTooLargeError('Corpo da requisição excede o limite permitido.'));
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => {
      cleanUp();
      resolve(Buffer.concat(chunks));
    };
    const onError = (error: Error) => {
      cleanUp();
      reject(error);
    };
    request.on('data', onData);
    request.once('end', onEnd);
    request.once('error', onError);
  });
}

/**
 * Descarta o corpo restante (com teto de bytes, tempo e drenos simultâneos) para que o cliente receba o erro sem RST.
 * Acima dos tetos a conexão é fechada sem drenar e o cliente pode receber reset em vez do status.
 */
function discardBody(request: IncomingMessage): Promise<void> {
  if (request.complete || request.destroyed || declaredLengthExceeds(request, MAX_DISCARD_BYTES)) return Promise.resolve();
  if (activeDiscards >= MAX_CONCURRENT_DISCARDS) return Promise.resolve();
  activeDiscards++;
  return new Promise((resolve) => {
    let discarded = 0;
    const finish = () => {
      activeDiscards--;
      clearTimeout(timer);
      request.off('data', onData);
      request.off('end', finish);
      request.off('error', finish);
      resolve();
    };
    const onData = (chunk: Buffer) => {
      discarded += chunk.length;
      if (discarded > MAX_DISCARD_BYTES) finish();
    };
    const timer = setTimeout(finish, MAX_DISCARD_MS);
    request.on('data', onData);
    request.once('end', finish);
    request.once('error', finish);
    request.resume();
  });
}

async function bodyOf(request: IncomingMessage): Promise<unknown> {
  const mediaType = request.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') throw new ValidationError('Content-Type deve ser application/json.');
  if (declaredLengthExceeds(request, MAX_BODY_BYTES)) throw new PayloadTooLargeError('Corpo da requisição excede o limite permitido.');
  try { return JSON.parse((await readBody(request)).toString('utf8')); }
  catch (error) {
    if (error instanceof PayloadTooLargeError) throw error;
    throw new ValidationError('JSON inválido.');
  }
}

function isExpectedError(error: unknown): boolean {
  return error instanceof PayloadTooLargeError
    || error instanceof ValidationError
    || error instanceof DomainError
    || error instanceof ApplicationError;
}

function logUnexpectedError(logger: (error: unknown) => void, error: unknown): void {
  try { logger(error); }
  catch { console.error('Falha ao registrar erro interno.', error); }
}

function errorResponse(error: unknown): { status: number; body: object } {
  if (error instanceof PayloadTooLargeError) return { status: 413, body: { code: 'PAYLOAD_TOO_LARGE', message: error.message } };
  if (error instanceof ValidationError) return { status: 400, body: { code: 'VALIDATION_ERROR', message: error.message } };
  if (error instanceof DomainError) {
    const status = error.code === 'RESERVATION_ALREADY_CANCELLED' ? 409 : 400;
    return { status, body: { code: error.code, message: error.message } };
  }
  if (error instanceof ApplicationError) {
    const status = error.code === 'RESERVATION_CONFLICT' ? 409 : 404;
    return { status, body: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } };
  }
  return { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } };
}

export function createAppServer(options: AppServerOptions) {
  const repository = new SqliteLabReserveRepository(options.databasePath);
  const service = new LabReserveService(repository);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/api/resources') {
        const startAt = url.searchParams.get('startAt');
        const endAt = url.searchParams.get('endAt');
        if ((startAt === null) !== (endAt === null)) throw new ValidationError('Início e término devem ser informados juntos.');
        return send(response, 200, { data: service.listAvailability(startAt ?? undefined, endAt ?? undefined) });
      }
      if (request.method === 'GET' && url.pathname === '/api/history') return send(response, 200, { data: service.getHistory() });
      if (request.method === 'POST' && url.pathname === '/api/reservations') {
        const input = reservationInput(await bodyOf(request));
        return send(response, 201, { data: service.createReservation(input) });
      }
      if (request.method === 'GET' && url.pathname === '/api/reservations') {
        const status = url.searchParams.get('status');
        if (status !== null && status !== 'CONFIRMED' && status !== 'CANCELLED') throw new ValidationError('Estado de reserva inválido.');
        const resourceId = url.searchParams.get('resourceId');
        return send(response, 200, { data: service.listReservations({
          ...(resourceId !== null ? { resourceId } : {}),
          ...(status ? { status } : {}),
        }) });
      }
      const match = /^\/api\/reservations\/([^/]+)\/(cancel|history)$/.exec(url.pathname);
      if (match?.[1] && match[2]) {
        const id = match[1];
        const action = match[2];
        if (request.method === 'POST' && action === 'cancel') return send(response, 200, { data: service.cancelReservation(id) });
        if (request.method === 'GET' && action === 'history') return send(response, 200, { data: service.getReservationHistory(id) });
      }
      return send(response, 404, { code: 'RESOURCE_NOT_FOUND', message: 'Rota não encontrada.' });
    } catch (error) {
      if (!isExpectedError(error)) logUnexpectedError(options.onUnexpectedError ?? console.error, error);
      const result = errorResponse(error);
      if (!request.complete) {
        response.shouldKeepAlive = false;
        await discardBody(request);
      }
      send(response, result.status, result.body);
    }
  });
  return {
    server,
    listen: (port: number, host: string) => new Promise<void>((resolve) => server.listen(port, host, resolve)),
    close: () => new Promise<void>((resolve, reject) => server.close((error) => { repository.close(); if (error) reject(error); else resolve(); })),
  };
}
