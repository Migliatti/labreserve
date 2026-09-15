import assert from 'node:assert/strict';
import test from 'node:test';
import { LabReserveService } from '../../src/application/lab-reserve-service.js';
import { SqliteLabReserveRepository } from '../../src/persistence/sqlite-lab-reserve-repository.js';

const clock = { now: () => new Date('2026-09-15T08:00:00Z') };
let sequence = 0;
const ids = { generate: () => `id-${++sequence}` };

test('cancelamento gera evento, libera intervalo e suporta filtros', () => {
  sequence = 0;
  const repository = new SqliteLabReserveRepository(':memory:');
  const service = new LabReserveService(repository, clock, ids);
  try {
    const first = service.createReservation({ resourceId: 'lab-chemistry', startAt: '2026-09-16T10:00:00Z', endAt: '2026-09-16T11:00:00Z' });
    service.cancelReservation(first.id);
    const replacement = service.createReservation({ resourceId: 'lab-chemistry', startAt: first.startAt, endAt: first.endAt });

    assert.equal(replacement.status, 'CONFIRMED');
    assert.equal(service.listReservations({ resourceId: 'lab-chemistry', status: 'CANCELLED' }).length, 1);
    assert.deepEqual(service.getReservationHistory(first.id).map((event) => event.type), [
      'RESERVATION_CREATED', 'RESERVATION_CANCELLED',
    ]);
  } finally { repository.close(); }
});
