import { randomUUID } from 'node:crypto';
import { TimeInterval } from '../domain/time-interval.js';
import { cancelReservation, createConfirmedReservation, type Reservation, type ReservationStatus } from '../domain/reservation.js';
import type { ReservationEvent } from '../domain/reservation-event.js';
import type { Resource } from '../domain/resource.js';
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

  listResources(): Resource[] {
    return this.repository.listResources();
  }

  listAvailability(startAt?: string, endAt?: string): Array<Resource & { available?: boolean }> {
    const resources = this.repository.listResources();
    if (startAt === undefined || endAt === undefined) return resources;
    const interval = TimeInterval.create(startAt, endAt);
    return resources.map((resource) => ({
      ...resource,
      available: resource.status === 'OPERATIONAL'
        && this.repository.findConflict(resource.id, interval.startAt, interval.endAt) === null,
    }));
  }

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

  cancelReservation(id: string): Reservation {
    return this.repository.transaction(() => {
      const current = this.repository.findReservation(id);
      if (!current) throw new ApplicationError('RESERVATION_NOT_FOUND', 'Reserva não encontrada.');
      const occurredAt = this.clock.now().toISOString();
      const reservation = cancelReservation(current, occurredAt);
      this.repository.updateReservation(reservation);
      this.repository.insertEvent({
        id: this.ids.generate(), reservationId: id,
        type: 'RESERVATION_CANCELLED', occurredAt,
      });
      return reservation;
    });
  }

  listReservations(filters: { resourceId?: string; status?: ReservationStatus }): Reservation[] {
    return this.repository.listReservations(filters);
  }

  getReservationHistory(reservationId: string): ReservationEvent[] {
    return this.repository.listHistory(reservationId);
  }

  getHistory(): ReservationEvent[] {
    return this.repository.listAllHistory();
  }
}
