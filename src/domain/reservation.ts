import { DomainError } from './domain-error.js';

export { DomainError } from './domain-error.js';

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export interface CreateReservationProps {
  id: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export function createConfirmedReservation(props: CreateReservationProps): Reservation {
  return { ...props, status: 'CONFIRMED', cancelledAt: null };
}

export function cancelReservation(reservation: Reservation, cancelledAt: string): Reservation {
  if (reservation.status === 'CANCELLED') {
    throw new DomainError('RESERVATION_ALREADY_CANCELLED', 'A reserva já foi cancelada.');
  }

  return { ...reservation, status: 'CANCELLED', cancelledAt: new Date(cancelledAt).toISOString() };
}
