import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { ApplicationError } from '../application/application-error.js';
import { LabReserveService, type CreateReservationInput } from '../application/lab-reserve-service.js';
import { DomainError } from '../domain/domain-error.js';
import { SqliteLabReserveRepository } from '../persistence/sqlite-lab-reserve-repository.js';

interface AppServerOptions { databasePath: string; }

class ValidationError extends Error {}

function reservationInput(value: unknown): CreateReservationInput {
  if (!value || typeof value !== 'object') throw new ValidationError('Dados da reserva inválidos.');
  const { resourceId, startAt, endAt } = value as Record<string, unknown>;
  if (typeof resourceId !== 'string' || typeof startAt !== 'string' || typeof endAt !== 'string') throw new ValidationError('Dados da reserva inválidos.');
  return { resourceId, startAt, endAt };
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function bodyOf(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ValidationError('JSON inválido.'); }
}

function errorResponse(error: unknown): { status: number; body: object } {
  if (error instanceof ValidationError) return { status: 400, body: { code: 'VALIDATION_ERROR', message: error.message } };
  if (error instanceof DomainError) return { status: 400, body: { code: error.code, message: error.message } };
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
      const result = errorResponse(error);
      return send(response, result.status, result.body);
    }
  });
  return {
    server,
    listen: (port: number, host: string) => new Promise<void>((resolve) => server.listen(port, host, resolve)),
    close: () => new Promise<void>((resolve, reject) => server.close((error) => { repository.close(); if (error) reject(error); else resolve(); })),
  };
}
