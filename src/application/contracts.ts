import type { ReservationEvent } from '../domain/reservation-event.js';
import type { Reservation } from '../domain/reservation.js';
import type { Resource } from '../domain/resource.js';

export interface LabReserveRepository {
  transaction<T>(work: () => T): T;
  listResources(): Resource[];
  findResource(id: string): Resource | null;
  findConflict(resourceId: string, startAt: string, endAt: string): Reservation | null;
  insertReservation(reservation: Reservation): void;
  insertEvent(event: ReservationEvent): void;
  listHistory(reservationId: string): ReservationEvent[];
}

export interface Clock { now(): Date; }
export interface IdGenerator { generate(): string; }
