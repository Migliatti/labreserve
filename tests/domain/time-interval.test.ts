import assert from 'node:assert/strict';
import test from 'node:test';
import { DomainError, TimeInterval } from '../../src/domain/time-interval.js';

test('normaliza um intervalo ISO 8601 com offset para UTC', () => {
  const interval = TimeInterval.create(
    '2026-09-16T10:00:00-03:00',
    '2026-09-16T11:00:00-03:00',
  );

  assert.equal(interval.startAt, '2026-09-16T13:00:00.000Z');
  assert.equal(interval.endAt, '2026-09-16T14:00:00.000Z');
});

test('rejeita um intervalo cujo término seja igual ao início', () => {
  assert.throws(
    () => TimeInterval.create('2026-09-16T10:00:00Z', '2026-09-16T10:00:00Z'),
    (error: unknown) => error instanceof DomainError && error.code === 'INVALID_TIME_RANGE',
  );
});

test('rejeita uma data que não esteja em ISO 8601 com fuso explícito', () => {
  assert.throws(
    () => TimeInterval.create('amanhã', '2026-09-16T11:00:00Z'),
    (error: unknown) => error instanceof DomainError && error.code === 'INVALID_TIME_RANGE',
  );
});

test('detecta sobreposição estrita e permite intervalos consecutivos', () => {
  const existing = TimeInterval.create('2026-09-16T10:00:00Z', '2026-09-16T11:00:00Z');

  assert.equal(
    existing.overlaps(TimeInterval.create('2026-09-16T10:30:00Z', '2026-09-16T11:30:00Z')),
    true,
  );
  assert.equal(
    existing.overlaps(TimeInterval.create('2026-09-16T11:00:00Z', '2026-09-16T12:00:00Z')),
    false,
  );
});
