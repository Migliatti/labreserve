import assert from 'node:assert/strict';
import test from 'node:test';
import { LabReserveService } from '../../src/application/lab-reserve-service.js';
import { ApplicationError } from '../../src/application/application-error.js';
import { SqliteLabReserveRepository } from '../../src/persistence/sqlite-lab-reserve-repository.js';

const clock = { now: () => new Date('2026-09-15T08:00:00Z') };
let sequence = 0;
const ids = { generate: () => `id-${++sequence}` };

test('cria reserva e evento atomicamente, recusa conflito e aceita horário consecutivo', () => {
  sequence = 0;
  const repository = new SqliteLabReserveRepository(':memory:');
  const service = new LabReserveService(repository, clock, ids);

  try {
    const first = service.createReservation({
      resourceId: 'lab-chemistry',
      startAt: '2026-09-16T10:00:00-03:00',
      endAt: '2026-09-16T11:00:00-03:00',
    });
    assert.equal(first.status, 'CONFIRMED');
    assert.equal(first.startAt, '2026-09-16T13:00:00.000Z');
    assert.equal(service.getReservationHistory(first.id)[0]?.type, 'RESERVATION_CREATED');

    assert.throws(
      () => service.createReservation({
        resourceId: 'lab-chemistry',
        startAt: '2026-09-16T13:30:00Z',
        endAt: '2026-09-16T14:30:00Z',
      }),
      (error: unknown) => error instanceof ApplicationError && error.code === 'RESERVATION_CONFLICT',
    );

    assert.equal(service.createReservation({
      resourceId: 'lab-chemistry',
      startAt: '2026-09-16T14:00:00Z',
      endAt: '2026-09-16T15:00:00Z',
    }).status, 'CONFIRMED');
  } finally {
    repository.close();
  }
});

test('reverte a reserva quando a gravação do evento falha', () => {
  const repository = new SqliteLabReserveRepository(':memory:');
  const generated = ['reservation-1', 'event-1', 'reservation-2', 'event-1'];
  const service = new LabReserveService(repository, clock, {
    generate: () => generated.shift() ?? 'unexpected-id',
  });

  try {
    service.createReservation({
      resourceId: 'lab-chemistry', startAt: '2026-09-17T10:00:00Z', endAt: '2026-09-17T11:00:00Z',
    });
    assert.throws(() => service.createReservation({
      resourceId: 'lab-chemistry', startAt: '2026-09-17T12:00:00Z', endAt: '2026-09-17T13:00:00Z',
    }));
    assert.equal(service.listReservations({}).length, 1);
  } finally {
    repository.close();
  }
});
