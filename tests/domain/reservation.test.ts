import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cancelReservation,
  createConfirmedReservation,
  DomainError,
} from '../../src/domain/reservation.js';

test('cancela uma reserva confirmada uma única vez', () => {
  const reservation = createConfirmedReservation({
    id: 'reservation-1',
    resourceId: 'lab-chemistry',
    startAt: '2026-09-16T10:00:00Z',
    endAt: '2026-09-16T11:00:00Z',
    createdAt: '2026-09-15T08:00:00Z',
  });

  const cancelled = cancelReservation(reservation, '2026-09-15T09:00:00Z');

  assert.equal(cancelled.status, 'CANCELLED');
  assert.equal(cancelled.cancelledAt, '2026-09-15T09:00:00.000Z');
  assert.throws(
    () => cancelReservation(cancelled, '2026-09-15T10:00:00Z'),
    (error: unknown) => error instanceof DomainError && error.code === 'RESERVATION_ALREADY_CANCELLED',
  );
});
