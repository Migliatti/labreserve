import { randomUUID } from 'node:crypto';
import { TimeInterval } from '../domain/time-interval.js';
import { createConfirmedReservation, type Reservation } from '../domain/reservation.js';
import type { ReservationEvent } from '../domain/reservation-event.js';
import type { Clock, IdGenerator, LabReserveRepository } from './contracts.js';
import { ApplicationError } from './application-error.js';

export interface CreateReservationInput {
  resourceId: string;
  startAt: string;
  endAt: string;
}

export class LabReserveService {
  constructor(
    private readonly repository: LabReserveRepository,
    private readonly clock: Clock = { now: () => new Date() },
    private readonly ids: IdGenerator = { generate: randomUUID },
  ) {}

  createReservation(input: CreateReservationInput): Reservation {
    const interval = TimeInterval.create(input.startAt, input.endAt);
    return this.repository.transaction(() => {
      if (!this.repository.findResource(input.resourceId)) {
        throw new ApplicationError('RESOURCE_NOT_FOUND', 'Recurso não encontrado.');
      }
      const conflict = this.repository.findConflict(input.resourceId, interval.startAt, interval.endAt);
      if (conflict) {
        throw new ApplicationError(
          'RESERVATION_CONFLICT',
          'O recurso já está reservado nesse período.',
          { conflictingReservationId: conflict.id },
        );
      }
      const createdAt = this.clock.now().toISOString();
      const reservation = createConfirmedReservation({
        id: this.ids.generate(), resourceId: input.resourceId,
        startAt: interval.startAt, endAt: interval.endAt, createdAt,
      });
      const event: ReservationEvent = {
        id: this.ids.generate(), reservationId: reservation.id,
        type: 'RESERVATION_CREATED', occurredAt: createdAt,
      };
      this.repository.insertReservation(reservation);
      this.repository.insertEvent(event);
      return reservation;
    });
  }

  getReservationHistory(reservationId: string): ReservationEvent[] {
    return this.repository.listHistory(reservationId);
  }
}
