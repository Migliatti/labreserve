import { DatabaseSync } from 'node:sqlite';
import type { LabReserveRepository } from '../application/contracts.js';
import type { ReservationEvent } from '../domain/reservation-event.js';
import type { Reservation } from '../domain/reservation.js';
import type { Resource, ResourceCategory, ResourceStatus } from '../domain/resource.js';

function resourceFromRow(row: Record<string, unknown>): Resource {
  const { id, name, category, status } = row;
  if (typeof id !== 'string' || typeof name !== 'string' || (category !== 'LABORATORY' && category !== 'EQUIPMENT') || (status !== 'OPERATIONAL' && status !== 'UNAVAILABLE')) throw new Error('Linha de recurso SQLite inválida.');
  return { id, name, category: category as ResourceCategory, status: status as ResourceStatus };
}

function reservationFromRow(row: Record<string, unknown>): Reservation {
  const { id, resourceId, startAt, endAt, status, createdAt, cancelledAt } = row;
  if (typeof id !== 'string' || typeof resourceId !== 'string' || typeof startAt !== 'string' || typeof endAt !== 'string' || (status !== 'CONFIRMED' && status !== 'CANCELLED') || typeof createdAt !== 'string' || (cancelledAt !== null && typeof cancelledAt !== 'string')) throw new Error('Linha de reserva SQLite inválida.');
  return { id, resourceId, startAt, endAt, status, createdAt, cancelledAt };
}

function eventFromRow(row: Record<string, unknown>): ReservationEvent {
  const { id, reservationId, type, occurredAt } = row;
  if (typeof id !== 'string' || typeof reservationId !== 'string' || (type !== 'RESERVATION_CREATED' && type !== 'RESERVATION_CANCELLED') || typeof occurredAt !== 'string') throw new Error('Linha de evento SQLite inválida.');
  return { id, reservationId, type, occurredAt };
}

export class SqliteLabReserveRepository implements LabReserveRepository {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    this.database = new DatabaseSync(path);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS resources (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, status TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, resource_id TEXT NOT NULL REFERENCES resources(id), start_at TEXT NOT NULL, end_at TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, cancelled_at TEXT) STRICT;
      CREATE TABLE IF NOT EXISTS reservation_events (id TEXT PRIMARY KEY, reservation_id TEXT NOT NULL REFERENCES reservations(id), type TEXT NOT NULL, occurred_at TEXT NOT NULL) STRICT;
    `);
    const seed = this.database.prepare('INSERT OR IGNORE INTO resources (id, name, category, status) VALUES (?, ?, ?, ?)');
    seed.run('lab-chemistry', 'Laboratório de Química', 'LABORATORY', 'OPERATIONAL');
    seed.run('equipment-microscope', 'Microscópio', 'EQUIPMENT', 'OPERATIONAL');
  }

  transaction<T>(work: () => T): T {
    this.database.exec('BEGIN');
    try { const result = work(); this.database.exec('COMMIT'); return result; }
    catch (error) { this.database.exec('ROLLBACK'); throw error; }
  }

  listResources(): Resource[] { return this.database.prepare("SELECT id, name, category, status FROM resources ORDER BY CASE category WHEN 'LABORATORY' THEN 0 ELSE 1 END, name").all().map(resourceFromRow); }
  findResource(id: string): Resource | null { const row = this.database.prepare('SELECT id, name, category, status FROM resources WHERE id = ?').get(id); return row ? resourceFromRow(row) : null; }
  findConflict(resourceId: string, startAt: string, endAt: string): Reservation | null { const row = this.database.prepare("SELECT id, resource_id AS resourceId, start_at AS startAt, end_at AS endAt, status, created_at AS createdAt, cancelled_at AS cancelledAt FROM reservations WHERE resource_id = ? AND status = 'CONFIRMED' AND start_at < ? AND end_at > ? LIMIT 1").get(resourceId, endAt, startAt); return row ? reservationFromRow(row) : null; }
  insertReservation(reservation: Reservation): void { this.database.prepare('INSERT INTO reservations VALUES (?, ?, ?, ?, ?, ?, ?)').run(reservation.id, reservation.resourceId, reservation.startAt, reservation.endAt, reservation.status, reservation.createdAt, reservation.cancelledAt); }
  findReservation(id: string): Reservation | null { const row = this.database.prepare('SELECT id, resource_id AS resourceId, start_at AS startAt, end_at AS endAt, status, created_at AS createdAt, cancelled_at AS cancelledAt FROM reservations WHERE id = ?').get(id); return row ? reservationFromRow(row) : null; }
  updateReservation(reservation: Reservation): void { this.database.prepare('UPDATE reservations SET status = ?, cancelled_at = ? WHERE id = ?').run(reservation.status, reservation.cancelledAt, reservation.id); }
  insertEvent(event: ReservationEvent): void { this.database.prepare('INSERT INTO reservation_events VALUES (?, ?, ?, ?)').run(event.id, event.reservationId, event.type, event.occurredAt); }
  listReservations(filters: { resourceId?: string; status?: Reservation['status'] }): Reservation[] {
    const clauses: string[] = [];
    const values: string[] = [];
    if (filters.resourceId) { clauses.push('resource_id = ?'); values.push(filters.resourceId); }
    if (filters.status) { clauses.push('status = ?'); values.push(filters.status); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.database.prepare(`SELECT id, resource_id AS resourceId, start_at AS startAt, end_at AS endAt, status, created_at AS createdAt, cancelled_at AS cancelledAt FROM reservations ${where} ORDER BY start_at, id`).all(...values).map(reservationFromRow);
  }
  listHistory(reservationId: string): ReservationEvent[] { return this.database.prepare('SELECT id, reservation_id AS reservationId, type, occurred_at AS occurredAt FROM reservation_events WHERE reservation_id = ? ORDER BY occurred_at, id').all(reservationId).map(eventFromRow); }
  close(): void { this.database.close(); }
}
